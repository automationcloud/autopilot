// Copyright 2020 Ubio Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import uuid from 'uuid';
import assert from 'assert';
import * as util from './util';
import * as model from './model';
import { Context } from './context';
import { migrateActionSpec } from './migrations';
import { retry, RetryOptions } from './retry';
import { RuntimeCtx } from './runtime';
import { Element } from './element';
import { Pipeline } from './pipeline';
import { Pipe } from './pipe';
import { ReporterService, ResolverService } from './services';
import { Module } from './module';
import { Logger } from '@automationcloud/cdp';
import { Unit } from './unit';
import { JsonSchema } from './schema';
import Ajv from 'ajv';

const ajv = new Ajv({
    messages: true,
});

export interface ActionClass extends Module {
    $schema: JsonSchema;
    new (owner: ActionList): Action;
}

export type ActionOwner = Context | Action;

/**
 * Actions are units of script execution.
 *
 * Each action implements `exec` method. It can contain logic
 * for accessing and manipulating the web page,
 * as well as for changing some internal state (e.g. setting a global)
 * or communicating with external services.
 *
 * Accessing the web page is usually implemented using {@link Pipeline}.
 * Most actions dealing with web pages will wrap their logic in
 * a `retry` which repeats the block in case of intermittent failures
 * (e.g. when element does not yet exist due to page loading).
 *
 * Actions can be stateful: an action may add instance properties and
 * modify them during its execution.
 * By convention state variable names should begin with dollar sign `$` —
 * these members will not be serialized. Additionally, stateful actions
 * should implement `reset` method and set the default values for each of its
 * transient state variables.
 *
 * Actions are organized in hierarchies: actions of certain types can have
 * nested actions.
 *
 * By default script executes actions sequentially without stepping into children.
 * Action implementation can override this behavior using `afterRun`
 * which allows implementing a variety of control flow constructs.
 *
 * @public
 */
export abstract class Action extends Unit<ActionList> {
    /**
     * Declares schema for validating values when selecting pipeline results.
     */
    static $schema: JsonSchema = {};

    /**
     * Unique ID of this action instance.
     * Must be unique within a Script, across all entities
     * @public
     */
    id: string = uuid.v4();

    /**
     * User-specified text that helps visually identify the action in Script tree.
     * @public
     */
    label: string = '';

    /**
     * User-specified notes (Markdown).
     * @public
     */
    notes: string = '';

    /**
     * Child (nested) actions of this action.
     * @public
     */
    children!: ActionList;

    /**
     * Runtime state of this action.
     * @public
     */
    $runtime!: ActionRuntime;

    /**
     * Actual implementation of an action.
     *
     * Note: `exec` should not contain flow control logic (i.e. modifying script
     * {@link Script.$runtime.playhead}), because it will be overwritten by `afterRun`.
     *
     * If you need conditional control flow (e.g. decide what playhead to use based on results
     * obtained in `exec`), then set a flag inside the `exec` and then check it in `afterRun`.
     * For most use cases `$runtime.bypassed` flag is used (it is also rendered in Autopilot).
     *
     * @public
     */
    abstract async exec(): Promise<void>;

    /**
     * Entity type, used for reflection.
     * @public
     */
    get $entityType() { return 'action'; }

    /**
     * Action `$type` is used to link a JSON spec to action implementation (class).
     * {@link ResolverService} keeps a mapping from `$type` to ActionClass for
     * all core and extension modules.
     *
     * @public
     */
    get type() { return this.$class.$type; }

    /**
     * An index of this action among its siblings.
     * @public
     */
    get $index(): number { return this.$owner.indexOf(this); }

    /**
     * A reference to {@link Context} enclosing this action.
     * @public
     */
    get $context(): Context { return this.$owner.$context; }

    /**
     * A reference to either a parent action, or enclosing {@link Context}.
     */
    get $parent(): ActionOwner { return this.$owner.$owner; }

    /**
     * @internal
     */
    get $stats() { return this.$script.$stats; }

    /**
     * @internal
     */
    get $reporter() {return this.$engine.get(ReporterService);}

    /**
     * A self-reference to satisfy {@link PipeOwner} interface.
     * @internal
     */
    get $action(): Action { return this; }

    /**
     * @internal
     */
    get $logger() {
        return this.$owner.$logger.child({
            action: this.collectLogInfo(),
        });
    }

    /**
     * A typed reference to action constructor.
     * @internal
     */
    get $class(): ActionClass { return this.constructor as ActionClass; }

    /**
     * @internal
     */
    get $key(): string { return `items/${this.$index}`; }

    /**
     * Deserializes an instance from an arbitrary JSON object.
     * This includes setting common fields (id, label, notes),
     * all parameters (instance properties with `@params` decorators)
     * and recursively reading `children`.
     *
     * @param spec JSON object.
     * @internal
     */
    init(spec: any) {
        const { id = uuid.v4(), label = '', notes = '', } = spec || {};
        this.id = id;
        this.label = label;
        this.notes = notes;
        this.children = new ActionList(this, 'children', spec.children || []);
        this.readParams(spec || {});
        this.reset();
    }

    /**
     * Override this method to allow placing child actions.
     * @public
     */
    hasChildren() {
        return false;
    }

    /**
     * Invoked by the engine when action state needs to be reset (e.g. at the start of the script,
     * on next iteration of enclosing loop, etc).
     *
     * Override this to clean any transient state associated with the action.
     *
     * @public
     */
    reset() {
        this.$runtime = {
            startedAt: null,
            finishedAt: null,
            error: null,
            bypassed: null,
        };
    }

    /**
     * Utility method to recursively call `reset` on current action instance
     * and all its descendants down the hierarchy.
     *
     * @public
     */
    resetSubtree() {
        this.reset();
        this.resetDescendants();
    }

    /**
     * Reset all action descendants, not including the action itself.
     *
     * @public
     */
    resetDescendants() {
        for (const action of this.descendentActions()) {
            action.reset();
        }
    }

    /**
     * Action label. Override this method to make label pre-computed (non-editable).
     *
     * @public
     */
    getLabel() {
        return this.label;
    }

    /**
     * @internal
     */
    isLabelEditable() {
        return !this.constructor.prototype.hasOwnProperty('getLabel');
    }

    /**
     * Validates `value` according to declared action schema.
     */
    validate<T>(value: T): T {
        const validator = ajv.compile(this.$class.$schema);
        const valid = validator(value);
        if (!valid) {
            throw util.createError({
                code: 'ActionValidationError',
                message: 'Value does not conform to action schema',
                details: {
                    messages: validator.errors?.map(_ => _.message),
                },
                retry: true,
            });
        }
        return value;
    }

    /**
     * Indicates whether the action is currently running.
     *
     * @public
     */
    isRunning() {
        const { startedAt, finishedAt } = this.$runtime;
        return startedAt && !finishedAt;
    }

    /**
     * Indicates whether the action was run and has finished running.
     *
     * @public
     */
    isFinished() {
        const { startedAt, finishedAt } = this.$runtime;
        return startedAt && finishedAt;
    }

    /**
     * @returns The duration of action execution in milliseconds, or 0 if action wasn't finished yet.
     * @public
     */
    getDuration() {
        const startedAt = this.$runtime.startedAt || 0;
        const finishedAt = this.$runtime.finishedAt || 0;
        return Math.max(0, Number(finishedAt - startedAt) || 0);
    }

    /**
     * @public
     * @returns Runtime status of action.
     *
     * - `idle` — action was not executed, or was reset
     * - `running` — action is in a middle of its execution
     * - `success` — action has finished execution successfully
     * - `fail` — action has failed with `$runtime.error` field indicating the error
     */
    getStatus(): ActionStatus {
        const { $runtime } = this;
        return !$runtime.startedAt ? 'idle' : !$runtime.finishedAt ? 'running' : !$runtime.error ? 'success' : 'fail';
    }

    /**
     * Creates a runtime context instance of this action.
     * This instance is subsequently passed to all pipe invokations
     * within a single action.
     *
     * @public
     */
    createCtx(): RuntimeCtx {
        return new RuntimeCtx(this);
    }

    /**
     * Action pipelines normally receive initial set of input elements from
     * parent action. This method delegates to parent (either action or context)
     * to evaluate such elements.
     *
     * In case of top-level actions, this method delegates to Context which
     * returns a single `#document` element with `{}` value (the default scope).
     *
     * @public
     */
    async resolveScope(): Promise<Element[]> {
        return await this.$parent.resolveChildrenScope();
    }

    /**
     * Actions containing children provide scope elements to its children.
     *
     * This method can be overridden to modify the children scopes
     * (e.g. to expose action outcomes to its children).
     *
     * @public
     */
    async resolveChildrenScope(): Promise<Element[]> {
        return await this.resolveScope();
    }

    /**
     * Runs the action.
     *
     * This method takes care of maintaining runtime state, statuses,
     * as well as emitting appropriate events.
     *
     * @public
     */
    async run(): Promise<void> {
        this.$script.setStatus('running');
        this.$script.$events.emit('action.start', this);
        if (!this.$context.$runtime.startedAt) {
            this.$context.$runtime.startedAt = Date.now();
        }
        // Make sure action execution is async!
        await Promise.resolve();
        this.resetDescendants();
        await this._trackRuntimeStats(() => this.exec());
        // Only incr stats for actions (not matchers)
        const duration = this.getDuration();
        this.$stats.incrActionRunTime(this.type, duration);
        this.$script.setStatus('idle');
        this.$script.$events.emit('action.end', this);
        this.afterRun();
    }

    /**
     * Executes after the action has finished running.
     * By default, {@link Action.leave} is called, which causes
     * playhead to skip to next sibling — or to go up the parent hierarchy.
     *
     * Overriding this allows implementing custom control flow
     * (i.e. use {@link Script.setPlayhead} to point to a different action).
     *
     * @public
     */
    afterRun() {
        this.leave();
    }

    /**
     * Wraps `asyncFn` with runtime stats tracking.
     * This method makes sure that `$runtime` object is correct.
     *
     * @param asyncFn Function to execute.
     * @internal
     */
    protected async _trackRuntimeStats(asyncFn: () => Promise<void>): Promise<void> {
        this.$runtime = {
            startedAt: Date.now(),
            finishedAt: null,
            error: null,
            bypassed: null,
        };
        try {
            await asyncFn();
        } catch (err) {
            this.$runtime.error = err;
            throw err;
        } finally {
            this.$runtime.finishedAt = Date.now();
        }
    }

    /**
     * Flow control: sets playhead to first child of this action.
     * Fails if `hasChildren()` returns `false`.
     *
     * @public
     */
    enter() {
        assert(this.hasChildren(), 'enter() not allowed for leaf nodes');
        // Proceed with next child or leave
        if (this.children.length) {
            this.$script.setPlayhead(this.children.first);
        } else {
            this.leave();
        }
    }

    /**
     * Flow control: leaves current action, by default delegates to `skip`.
     *
     * This method is called on actions with children after the last child
     * has finished its execution.
     *
     * Implementations can override this to specify a different "leave" behaviour.
     * For example, loops are implemented by overriding `leave` and calling
     * `this.$script.setPlayhead(this)`.
     *
     * @public
     */
    leave() {
        this.skip();
    }

    /**
     * Flow control: advances playhead to next sibling or, if next sibling doesn't exist,
     * leaves parent action.
     *
     * @public
     */
    skip() {
        const nextSibling = this.$owner.nextSibling(this);
        if (nextSibling) {
            this.$script.setPlayhead(nextSibling);
        } else {
            this.$parent.leave();
        }
    }

    /**
     * @deprecated Use `retry` instead.
     */
    async executeWithRetry<T>(asyncFn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
        return this.retry(asyncFn, options);
    }

    /**
     * Wraps arbitrary function in a retry loop, which automatically repeats it with delay
     * in case of intermittent failures.
     *
     * Intermittent failures must be indicated explicitly by adding `retry: true` flag
     * to the error object.
     *
     * @param asyncFn Function to execute.
     * @param options Retry options configuring delays and timeouts.
     * @returns The result of `asyncFn`.
     * @public
     */
    async retry<T>(asyncFn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
        return await retry(this.$script, asyncFn, options);
    }

    /**
     * A shortcut to execute a `pipeline` using parent's scope and
     * assert that its result returns 1 or 0 elements.
     *
     * @param pipeline Pipeline to execute.
     * @param optional If `true`, 0 elements are allowed.
     * @param ctx Runtime context (if not provided, a new one will be created).
     * @public
     */
    async selectSingle(
        pipeline: Pipeline,
        optional: boolean,
        ctx: RuntimeCtx = this.createCtx(),
    ): Promise<Element | null> {
        const inputSet = await this.resolveScope();
        return optional ?
            await pipeline.selectOneOrNull(inputSet, ctx) :
            await pipeline.selectOne(inputSet, ctx);
    }

    /**
     * A shortcut to execute a `pipeline` using parent's scope and
     * assert that its result returns exactly 1 element.
     *
     * @param pipeline Pipeline to execute.
     * @param ctx Runtime context (if not provided, a new one will be created).
     * @public
     */
    async selectOne(pipeline: Pipeline, ctx: RuntimeCtx = this.createCtx()): Promise<Element> {
        const inputSet = await this.resolveScope();
        return await pipeline.selectOne(inputSet, ctx);
    }

    /**
     * A shortcut to execute a `pipeline` using parent's scope.
     *
     * @param pipeline Pipeline to execute.
     * @param ctx Runtime context (if not provided, a new one will be created).
     * @public
     */
    async selectAll(pipeline: Pipeline, ctx: RuntimeCtx = this.createCtx()): Promise<Element[]> {
        const inputSet = await this.resolveScope();
        return await pipeline.selectAll(inputSet, ctx);
    }


    /**
     * @returns Depth within script hierarchy, with `Context` having depth `0`
     * and its immediate children having depth `1`.
     * @public
     */
    getDepth(): number {
        return 1 + this.$parent.getDepth();
    }

    /**
     * Iterates through all descendants (i.e. child, grandchild, etc.) of current action.
     *
     * Current action is not included in iteration.
     *
     * @public
     */
    *descendentActions(): IterableIterator<Action> {
        for (const child of this.children) {
            yield child;
            yield* child.descendentActions();
        }
    }

    /**
     * Iterates through pipeline hierarchy of current action.
     *
     * Note: pipes from nested actions are not included.
     *
     * @public
     */
    *descendentPipes(): IterableIterator<Pipe> {
        for (const value of Object.values(this)) {
            if (value instanceof Pipeline) {
                yield* value.descendentPipes();
            }
        }
    }

    /**
     * @returns Previous sibling action, or `null` if it's the first action in the list.
     * @public
     */
    previousSiblings() {
        return this.$owner.previousSiblings(this);
    }

    /**
     * @returns Next sibling action, or `null` if it's the last action in the list.
     * @public
     */
    nextSiblings() {
        return this.$owner.nextSiblings(this);
    }

    /**
     * Collects all input keys by traversing pipelines.
     * Used for static analysis.
     *
     * @internal
     */
    *collectInputKeys() {
        const { inputKey } = this as any;
        if (inputKey) {
            yield inputKey;
        }
        for (const pipe of this.descendentPipes()) {
            for (const param of pipe.getParams()) {
                if (param.type === 'string' && param.source === 'inputs') {
                    const val = pipe.getParamValue(param.name);
                    if (val) {
                        yield val;
                    }
                }
            }
        }
    }

    /**
     * Collects output keys. Used for static analysis.
     * @internal
     */
    *collectOutputKeys(): IterableIterator<string> {}

    /**
     * Collects definitions used by this action, including transitive ones.
     * @internal
     */
    getUsedDefinitionIds(): string[] {
        const set: Set<string> = new Set();
        _collectUsedDefinitions(set, this);
        return Array.from(set);
    }

    /**
     * Collects definition ids used by this action's pipelines.
     * @internal
     */
    *collectDefinitionIds(): IterableIterator<string> {
        for (const pipe of this.descendentPipes()) {
            for (const param of pipe.getParams()) {
                if (param.type === 'definition') {
                    const definitionId = pipe.getParamValue(param.name);
                    yield definitionId;
                }
            }
        }
    }

    /**
     * Collects details for logging.
     * @internal
     */
    protected collectLogInfo() {
        return {
            id: this.id,
            type: this.type,
            label: this.label,
            contextId: this.$context.id,
            runtime: this.$runtime,
        };
    }
}

/**
 * @internal
 */
export class ActionList extends model.EntityList<ActionOwner, Action> {

    create(_spec: any): Action {
        const spec = migrateActionSpec(util.cloneWithoutIdsCollision(_spec || {}, this.$script.$ids));
        spec.type = this.coerceSpecType(spec.type);
        const ActionClass = this.$resolver.getActionClass(spec.type);
        const action = new ActionClass(this);
        action.init(spec);
        return action;
    }

    get $entityType() {
        return 'action-list';
    }

    get $script() { return this.$owner.$script; }
    get $context() { return this.$owner.$context; }
    get $logger(): Logger { return this.$owner.$logger; }
    get $idDatabase() { return this.$script; }
    get $resolver() { return this.$script.$engine.get(ResolverService); }

    protected coerceSpecType(type: string): string {
        switch (type) {
            case 'matcher':
                return 'Flow.expect';
            case 'definition':
                return 'Flow.find';
            default:
                return type;
        }
    }

    resolveScope() {
        return this.$owner.resolveChildrenScope();
    }
}

/**
 * @internal
 */
export class MatcherList extends ActionList {
    protected coerceSpecType(_type: string): string {
        return 'matcher';
    }
}

/**
 * @internal
 */
export class DefinitionList extends ActionList {
    protected coerceSpecType(_type: string): string {
        return 'definition';
    }
}

/**
 * Actions whose `$type` cannot be translated into action class
 * are marked as `unresolved`.
 *
 * @internal
 */
export class UnresolvedAction extends Action {
    static $type = 'unresolved';
    static $icon = 'fas fa-circle';
    static $hidden = true;

    $originalSpec: any;

    init(spec: any = {}) {
        super.init(spec);
        this.$originalSpec = spec;
    }

    toJSON() {
        // The original spec is preserved on serialization
        return this.$originalSpec;
    }

    async exec() {
        throw util.scriptError(`Cannot run unresolved action: ${this.$originalSpec.type}`);
    }
}

/**
 * Runtime state of an action. This object is changed when action runs or after reset.
 *
 * @public
 */
export interface ActionRuntime {
    startedAt: number | null;
    finishedAt: number | null;
    error: Error | null;
    bypassed: boolean | null;
}

export type ActionStatus = 'idle' | 'running' | 'success' | 'fail';

function _collectUsedDefinitions(ids: Set<string>, action: Action) {
    for (const definitionId of action.collectDefinitionIds()) {
        if (ids.has(definitionId)) {
            // Loop of death!
            continue;
        }
        ids.add(definitionId);
        const def = action.$script.getDefinitionById(definitionId);
        if (def) {
            _collectUsedDefinitions(ids, def);
        }
    }
}
