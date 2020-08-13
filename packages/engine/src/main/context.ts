import uuid from 'uuid';

import { Script } from './script';
import { Action, ActionList, MatcherList, DefinitionList } from './action';
import { Element } from './element';

import * as util from './util';
import * as model from './model';
import { MatcherAction } from './matcher';
import { ScriptException } from './exception';

export type ContextType = 'main' | 'context' | 'checkpoint';

/**
 * Contexts are units of script organization.
 * They contain a list of actions to be executed when certain page is recognized.
 *
 * Page recognition is performed by `matchers` — assertion actions which are executed in parallel
 * during context matching. If all context matchers execute successfully, then
 * the context is entered and actions execute as normal.
 *
 * @public
 */
export class Context extends model.Entity<ContextList> {
    /**
     * Unique ID of this action instance.
     * Must be unique within a Script, across all entities
     *
     * @public
     */
    id: string = uuid.v4();

    /**
     * Context name.
     * @public
     */
    name: string;

    /**
     * Context type.
     *
     * - `main` represents script entry point
     * - `context` is a regular context which participates in context matching
     * - `checkpoint` is an alternative entry point used by checkpoints
     *
     * @public
     */
    type: ContextType;

    /**
     * Determines the behaviour when the end of the context is reached.
     *
     * - `normal` proceeds with context matching
     * - `fail` aborts script playback with designated error
     * - `success` stops script playback and emits `success` event
     *
     * Note: for simplicity, main context is treated as `success` context
     * when it's the only context (i.e. because there is nothing else to match or execute).
     *
     * @public
     */
    flowType: 'normal' | 'fail' | 'success';

    /**
     * Specifies custom error for `fail` contexts.
     * @public
     */
    errorCode: string | null;

    /**
     * Specifies how many times the context can be visited.
     * Contexts visited up to the limit no longer participate in matching.
     *
     * @public
     */
    limit: number;

    /**
     * Specifies whether mandatory waiting is required before entering the context.
     * Enabling this makes all context matching slower, but more reliable.
     *
     * @public
     */
    matchMode: 'fast' | 'slow';

    /**
     * Tags contexts as potential 3dsecure resolutions.
     * @internal
     */
    resolve3dsecure: boolean;

    /**
     * List of context actions.
     * @public
     */
    children: ActionList;

    /**
     * List of context matchers.
     * @public
     */
    matchers: MatcherList;

    /**
     * List of context defintions.
     * @public
     */
    definitions: DefinitionList;

    /**
     * Rutime state of the context.
     * @public
     */
    $runtime!: ContextRuntime;

    /**
     * Constructs a new Context instance, deserializing it from JSON `spec`.
     *
     * Note: constructor should not be called externally; to create a new context
     * dynamically use `$script.context.insert({ jsonSpec })`.
     *
     * @param owner {@link ContextList} this context belongs to.
     * @param spec JSON-serialized spec of context.
     * @internal
     */
    constructor(owner: ContextList, spec: any = {}) {
        super(owner);
        const {
            id = uuid.v4(),
            name = 'New Context',
            type = 'context',
            flowType = 'normal',
            errorCode = null,
            limit = 1,
            matchMode = 'fast',
            resolve3dsecure = true,
        } = spec;
        this.id = id;
        this.name = type === 'context' ? name : `<${type}>`;
        this.type = type;
        this.flowType = flowType;
        this.errorCode = errorCode;
        this.limit = limit;
        this.matchMode = matchMode;
        this.resolve3dsecure = resolve3dsecure;

        this.matchers = new MatcherList(this, 'matchers', spec.matchers || []);
        this.definitions = new DefinitionList(this, 'definitions', spec.definitions || []);
        this.children = new ActionList(this, 'children', spec.actions || spec.children || []);

        this.reset();

        // Obsolete formats
        if (spec.finalType) {
            this.flowType = spec.finalType;
        }
    }

    /**
     * Entity type, used for reflection.
     * @public
     */
    get $entityType() { return 'context'; }

    /**
     * An index of this context among its siblings.
     * @public
     */
    get $index(): number { return this.$owner.indexOf(this); }

    /**
     * A reference to {@link Script} enclosing the context.
     * @public
     */
    get $script() { return this.$owner.$script; }

    /**
     * A self-reference to satisfy {@link ActionOwner} interface.
     * @internal
     */
    get $context() { return this; }

    /**
     * {@link BrowserService} the script is connected to.
     * @public
     */
    get $browser() { return this.$script.$browser; }

    /**
     * The {@link Page} the script is currently attached to.
     * @public
     */
    get $page() { return this.$script.$page; }

    /**
     * @internal
     */
    get $key(): string { return `items/${this.$index}`; }

    /**
     * @internal
     */
    get $logger() {
        return this.$script.$logger.child({
            context: this._collectLogInfo(),
        });
    }

    // Resetting

    /**
     * Resets the context along with all the entities it encloses (actions, matchers, definitions).
     *
     * @public
     */
    reset() {
        this.$runtime = {
            startedAt: null,
            finishedAt: null,
            visited: 0,
        };
        this.resetMatchers();
        this.resetDescendants();
    }

    /**
     * Resets all context actions.
     *
     * @public
     */
    resetDescendants() {
        for (const action of this.children) {
            action.resetSubtree();
        }
    }

    /**
     * Resets all context matchers.
     *
     * @public
     */
    resetMatchers() {
        for (const matcher of this.matchers) {
            matcher.resetSubtree();
        }
    }

    // Traversal

    /**
     * @public
     */
    getDepth() {
        return 0;
    }

    /**
     * @public
     */
    hasChildren() {
        return true;
    }

    /**
     * @public
     */
    *descendentActions(): IterableIterator<Action> {
        for (const matcher of this.matchers) {
            yield matcher;
        }
        for (const child of this.children) {
            yield child;
            yield* child.descendentActions();
        }
        for (const definition of this.definitions) {
            yield definition;
        }
    }

    /**
     * Resolves {@link Action} by its unique id.
     * @param id
     * @public
     */
    getActionById(id: string): Action | null {
        for (const action of this.descendentActions()) {
            if (action.id === id) {
                return action;
            }
        }
        return null;
    }

    /**
     * Creates a list containing `#document` element with `{}` value
     * which acts as a default scope of context children.
     *
     * @public
     */
    async resolveChildrenScope(): Promise<Element[]> {
        const document = await this.$page.document();
        const el = new Element(document, {});
        return [el];
    }

    /**
     * Indicates whether the context is running (i.e. has entered but has not finished).
     *
     * @public
     */
    isRunning() {
        const { startedAt, finishedAt } = this.$runtime;
        return startedAt && !finishedAt;
    }

    /**
     * Indicates whether the context has finished running.
     *
     * @public
     */
    isFinished() {
        const { startedAt, finishedAt } = this.$runtime;
        return startedAt && finishedAt;
    }

    /**
     * Indicates the duration in milliseconds of context playback, from entering to leaving.
     *
     * @public
     */
    getDuration() {
        const startedAt = this.$runtime.startedAt || 0;
        const finishedAt = this.$runtime.finishedAt || 0;
        return Math.max(0, Number(finishedAt - startedAt) || 0);
    }

    /**
     * Indicates if the number of times context has entered matches or exceeds the `limit`.
     *
     * @public
     */
    isLimitReached() {
        return this.$runtime.visited >= this.limit;
    }

    /**
     * Runs all matchers in parallel and returns `true` if all of them run successfully.
     *
     * @public
     */
    async runMatch(): Promise<boolean> {
        try {
            const promises = [];
            for (const action of this.matchers) {
                if (action instanceof MatcherAction) {
                    promises.push(action.performMatch());
                }
            }
            await Promise.all(promises);
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Enters the context.
     *
     * This sets all necessary state and moves script playhead to the first action.
     *
     * @public
     */
    enter(): void {
        this.$script.$events.emit('context.enter', this);
        // Enforce visits limit
        this.$runtime.visited += 1;
        if (this.$runtime.visited > this.limit) {
            // Note: this seems like no longer possible since visited contexts are excluded from matching
            throw new ScriptException({
                name: this.errorCode ? this.errorCode : 'ContextLimitError',
                message: 'Context limit exceeded',
                retry: false,
                scriptError: this.errorCode != null,
                details: {
                    id: this.id,
                    name: this.name,
                },
            });
        }
        this.$runtime.startedAt = Date.now();
        // Make sure all action states are reset
        this.resetDescendants();
        // Proceed with next child or leave
        const firstAction = this.children.first;
        if (firstAction) {
            this.$script.setPlayhead(firstAction);
        } else {
            this.leave();
        }
    }

    /**
     * Leaves the context, setting script playhead to `null` (i.e. context matching will be next).
     *
     * @param finalizeContext Specifies whether to include context finalization steps
     * as specified by `flowType` field.
     * @public
     */
    leave(finalizeContext: boolean = true): void {
        this.$script.$events.emit('context.leave', this);
        this.$script.setPlayhead(null);
        this.$runtime.finishedAt = Date.now();
        if (finalizeContext) {
            this.finalize();
        }
    }

    /**
     * Finalizes the script, according to `flowType`.
     *
     * @internal
     */
    protected finalize() {
        // Single main contexts are automatically treated as successful
        const isSingleMain =
            this.type === 'main' && this.$script.contexts.length === 1 && this.$script.contexts.get(0) === this;
        const success = isSingleMain || this.flowType === 'success';
        if (success) {
            this.$script.setStatus('success');
        } else if (this.flowType === 'fail') {
            const code = this.errorCode || 'failureContext';
            throw new ScriptException({
                name: code,
                message: `Expected failure: ${code}`,
                retry: false,
                scriptError: true,
            });
        }
    }

    /**
     * @internal
     */
    private _collectLogInfo() {
        return {
            contextId: this.id,
            contextName: this.name,
        };
    }

}

/**
 * @internal
 */
export class ContextList extends model.EntityList<Script, Context> {
    create(_spec: any): Context {
        const spec = util.cloneWithoutIdsCollision(_spec, this.$script.$ids);
        // Multiple "main" and "checkpoint" are not allowed;
        // so spec is converted to regular context if they already exist
        for (const type of ['main', 'checkpoint']) {
            if (spec.type === type && this.items.some(_ => _.type === type)) {
                spec.type = 'context';
            }
        }
        return new Context(this, spec);
    }

    insert(spec: any, index: number = this.items.length): Context {
        // Enforce specific positions for system contexts
        if (spec.type === 'main') {
            index = 0;
        }
        if (spec.type === 'checkpoint') {
            index = 1;
        }
        return super.insert(spec, index);
    }

    get $entityType() { return 'context-list'; }
    get $script() { return this.$owner; }
    get $engine() { return this.$owner.$engine; }
    get $idDatabase() { return this.$script; }
}

/**
 * Runtime state of a context.
 *
 * @public
 */
export interface ContextRuntime {
    startedAt: number | null;
    finishedAt: number | null;
    visited: number;
}
