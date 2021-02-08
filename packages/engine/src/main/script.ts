// Copyright 2020 UBIO Limited
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
import { EventEmitter } from 'events';
import { Context, ContextList } from './context';
import { Action } from './action';
import * as util from './util';
import * as model from './model';
import { ScriptSearchQuery, ScriptSearchResult, ScriptSearch, ScriptSearchOptions } from './search';
import { ContextMatchTimer } from './context-match-timer';
import jsonPointer from 'jsonpointer';
import { numberConfig, Configuration, Logger, Exception } from '@automationcloud/cdp';
import { Engine } from './engine';
import {
    ReporterService,
    RegistryService,
    BrowserService,
    FlowService,
    GlobalsService,
    ResolverService,
} from './services';
import crypto from 'crypto';
import { ExtensionVersion } from './extension';
import { Inspection, InspectionReport, InspectionNode, ScriptInspection, ContextInspection, ActionInspection } from './inspection';
import { DefinitionAction } from './definition';

const CONTEXT_MATCH_INTERVAL = numberConfig('CONTEXT_MATCH_INTERVAL', 100);
const CONTEXT_MATCH_SLOW_MARGIN = numberConfig('CONTEXT_MATCH_SLOW_MARGIN', 3000);

/**
 * Represents an Automation Script instance.
 *
 * The script is typically created from JSON source, and needs {@link Engine}
 * for establishing connectivity to {@link Browser} and the rest of the services.
 *
 * From structural perspective a Script can be viewed as a big tree of all the entity
 * it encloses: contexts, actions and pipes. Since each script entity has a UUID,
 * script instance maintains an id database to preserve the uniqueness of UUIDs
 * after various operations like inserting/cloning/moving the entities.
 *
 * Script instance is stateful; notable aspects of script runtime state include:
 *
 *  - `status` — whether the script is idle, running, succeeded or failed
 *  - `mode` — whether the script will stop after finishing current action or context, or whether
 *    it will only stop on reaching terminal status
 *  - `playhead` — the current (or next, if script is paused) action being run;
 *    `null` indicates context matching state
 *
 * Scripts are JSON-serializable. JSON structure is designed to be consumable by Autopilot and Engine;
 * other applications should avoid depending on it.
 *
 * @public
 */
export class Script extends model.Entity<null> implements model.IdDatabase {

    /**
     * @public
     */
    $engine: Engine;

    /**
     * Script emits various events that can be listened to. Most of the events are self-explanatory:
     *
     * - `context.enter (context: Context)`
     * - `context.leave (context: Context)`
     * - `action.start (action: Action)`
     * - `action.end (action: Action)`
     * - `input ({ key: string })`
     * - `output ({ key: string, data: any })`
     * - `statusUpdated (newStatus: ScriptPlaybackStatus)`
     * - `fail (error: Error)`
     * - `success`
     * - `done` — emitted after either `success` or `fail`.
     *
     * @public
     */
    $events: EventEmitter = new EventEmitter();

    /**
     * UUID of this script. This UUID should remain immutable across all script versions to allow for revisions.
     *
     * @public
     */
    id: string;

    /**
     * List of contexts.
     *
     * @public
     */
    contexts: ContextList;

    /**
     * List of URL patterns for Chrome to block whilst running the script.
     *
     * @public
     */
    blockedUrlPatterns: string[];

    /**
     * Metadata of extensions the script depends on.
     *
     * Engine follows the best practice of managing the dependencies with SemVer
     * and assigns "caret" version ranges. This means that `my-custom-extension:1.1.2`
     * will match the dependency `my-custom-extension:^1.0.0`.
     *
     * @public
     */
    dependencies: ExtensionVersion[] = [];

    /**
     * Script playback state.
     *
     * Note: you should avoid modifying this directly, because most fields are computed
     * by Engine. For setting playhead use {@link Script.setPlayhead}.
     *
     * @internal
     */
    $playback!: ScriptPlaybackState;

    /**
     * Set of all ids used by the script.
     *
     * @internal
     */
    $ids: Map<string, any> = new Map();

    /**
     * An array of all inputs consumed by the script.
     *
     * @internal
     */
    $inputs: ScriptInput[] = [];

    /**
     * An array of all outputs produced by the script.
     *
     * @internal
     */
    $outputs: ScriptOutput[] = [];

    /**
     * @internal
     */
    $consumedInputKeys: Set<string> = new Set();

    /**
     * Loads the script from JSON `spec` and its dependencies.
     * This method will resolve the dependencies using {@link RegistryService}
     * and load the necessary extensions with {@link ResolverService}.
     *
     * For better isolation, it's best to purge existing extensions
     * using {@link ResolverService.purgeExtensions} prior to loading a script.
     *
     * @param $engine
     * @param spec
     * @public
     */
    static async load($engine: Engine, spec: any = {}) {
        const resolver = $engine.get(ResolverService);
        const registry = $engine.get(RegistryService);
        const unmet = [...resolver.unmetDependencies(spec.dependencies || [])];
        const loadPromises = unmet.map(async dep => {
            const ext = await registry.loadExtension(dep.name, dep.version);
            resolver.addExtension(ext);
        });
        await Promise.all(loadPromises);
        return new Script($engine, spec);
    }

    /**
     * Creates new Script instance.
     *
     * Note: this method does not resolve script dependencies. Use {@link Script.load}
     * to resolve all the extensions the script depends on.
     *
     * @param $engine
     * @param spec
     * @internal
     */
    constructor($engine: Engine, spec: any = {}) {
        super(null);
        this.$engine = $engine;
        const { id = uuid.v4(), contexts = [], blockedUrlPatterns = [], dependencies = [] } = spec;
        this.id = id;
        this.contexts = new ContextList(this, 'contexts', contexts);
        this.dependencies = dependencies;
        this.blockedUrlPatterns = blockedUrlPatterns;
        this.applyContextConstraints();
        this.reset();
    }

    /**
     * Serializes this instance into JSON.
     *
     * Note: only configuration is saved; runtime state is not preserved.
     *
     * @public
     */
    toJSON() {
        this.dependencies = [...this.collectUsedDependencies()].map(dep => {
            return { name: dep.name, version: '^' + dep.version };
        });
        return super.toJSON();
    }

    /**
     * Entity type, for reflection.
     *
     * @public
     */
    get $entityType() {
        return 'script';
    }

    /**
     * @internal
     */
    get $key() {
        return '';
    }

    /**
     * A reference to {@link BrowserService} the script is connected to.
     *
     * @public
     */
    get $browser() { return this.$engine.get(BrowserService); }

    /**
     * A reference to Chrome {@link Page} the script is connected to.
     *
     * @public
     */
    get $page() { return this.$browser.page; }

    /**
     * @public
     */
    get $logger() { return this.$engine.get(Logger); }

    /**
     * @public
     */
    get $flow() { return this.$engine.get(FlowService); }

    /**
     * @internal
     */
    get $config() { return this.$engine.get(Configuration); }

    /**
     * @internal
     */
    get $globals() { return this.$engine.get(GlobalsService); }

    /**
     * @internal
     */
    get $reporter() { return this.$engine.get(ReporterService); }

    /**
     * Resets the runtime state of script instance.
     *
     * @public
     */
    reset() {
        this.$inputs = [];
        this.$outputs = [];
        this.$playback = {
            paused: false,
            running: false,
            mode: 'action',
            status: 'idle',
            error: null,
            playhead: null,
            lastContext: null,
        };
    }

    /**
     * @param id
     * @internal
     */
    registerId(id: string, object: any) {
        this.$ids.set(id, object);
    }

    /**
     * @param id
     * @internal
     */
    unregisterId(id: string) {
        this.$ids.delete(id);
    }

    // Inputs, outputs

    /**
     * @param key
     * @internal
     */
    hashInputOutputKey(key: string) {
        const i = key.indexOf(':');
        if (i > -1) {
            const prefix = key.substring(0, i);
            const suffix = key.substring(i + 1);
            const hash = crypto
                .createHash('sha1')
                .update(suffix, 'utf8')
                .digest('hex');
            return `${prefix}:${hash}`;
        }
        return key;
    }

    /**
     * Requests input with specified `key` using {@link FlowService}.
     *
     * Script does not request same inputs twice in its runtime, so subsequent calls
     * with the same `key` will return a cached copy.
     *
     * @param key
     * @public
     */
    async requestInput(key: string): Promise<any> {
        key = this.hashInputOutputKey(key);
        if (!this.$consumedInputKeys.has(key)) {
            this.$consumedInputKeys.add(key);
            this.$events.emit('input', { key });
        }
        const existing = this.$flow.isInputsCached() ? this.$inputs.find(d => d.key === key) : null;
        if (!existing) {
            const data = await this.$flow.requestInputData(key);
            this.$inputs.push({ key, data });
            return data;
        }
        return existing.data;
    }

    /**
     * Peeks input with specified `key`. This is an alternative way of accessing
     * the "pre-supplied" inputs without triggering a "request input" event.
     *
     * @param key
     * @public
     */
    async peekInput(key: string): Promise<any | null> {
        key = this.hashInputOutputKey(key);
        return await this.$flow.peekInputData(key);
    }

    /**
     * Sends output with specified `key` and `data`.
     *
     * @param key
     * @param data
     * @public
     */
    async sendOutput(key: string, data: any) {
        key = this.hashInputOutputKey(key);
        this.$outputs.push({ key, data });
        await this.$flow.sendOutputData(key, data);
        this.$events.emit('output', { key, data });
    }

    /**
     * @internal
     */
    wasOutputEmitted(key: string): boolean {
        return this.$outputs.some(_ => _.key === key);
    }

    /**
     * Resolves when all outputs with specified `keys` are available.
     * The output data is returned as an array in the same order as specified keys.
     *
     * ProTip™ Use destructuring to access the data:
     *
     * ```
     * const [products, deliveryOptions] = await job.waitForOutputs('products', 'deliveryOptions');
     * ```
     *
     * @param keys output keys
     * @public
     */
    async waitForOutputs(...keys: string[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const onOutput = () => {
                const outputs = keys.map(key => this.$outputs.find(_ => _.key === key)).filter(Boolean);
                if (outputs.length === keys.length) {
                    cleanup();
                    resolve(outputs.map(_ => _?.data));
                }
            };
            const onSuccess = () => {
                cleanup();
                reject(new Exception({
                    name: 'MissingOutputs',
                    message: `Script succeded, but specified outputs were not emitted`,
                    details: { keys },
                }));
            };
            const onFail = () => {
                cleanup();
                reject(new Exception({
                    name: 'MissingOutputs',
                    message: `Script failed, and specified outputs were not emitted`,
                    details: { keys },
                }));
            };
            const cleanup = () => {
                this.$events.removeListener('output', onOutput);
                this.$events.removeListener('success', onSuccess);
                this.$events.removeListener('fail', onFail);
            };
            this.$events.addListener('output', onOutput);
            this.$events.addListener('success', onSuccess);
            this.$events.addListener('fail', onFail);
            onOutput();
        });
    }

    // Globals

    /**
     * @returns A list of keys of currently available globals.
     * @public
     */
    getGlobalKeys() {
        return this.$globals.getKeys();
    }

    /**
     * Returns the value of global identified by `key`.
     * `optional` flag controls whether to throw an exception or return `null`
     * in case global does not yet exist.
     *
     * @param key
     * @param optional
     * @public
     */
    getGlobal(key: string, optional: boolean = false): any {
        return this.$globals.getGlobal(key, optional);
    }

    /**
     * Sets the value of global identified by `key`.
     *
     * @param key
     * @param value
     * @public
     */
    setGlobal(key: string, value: any): void {
        return this.$globals.setGlobal(key, value);
    }

    /**
     * Appends specified `values` to global identified by `key`.
     * If global already exists, its value must be an array.
     *
     * @param key
     * @param values
     * @public
     */
    appendGlobal(key: string, values: any[]): void {
        return this.$globals.appendGlobal(key, values);
    }

    /**
     * Removes global identified by `key`.
     * @param key
     * @public
     */
    removeGlobal(key: string): void {
        return this.$globals.removeGlobal(key);
    }

    /**
     * Obtains a script entity by specified JSON pointer.
     *
     * @param path
     * @internal
     */
    get(path: string): any {
        return jsonPointer.get(this, path);
    }

    /**
     * @internal
     */
    applyContextConstraints(): void {
        // <main> context is created automatically during script initialization.
        const hasMainContext = this.contexts.find(_ => _.type === 'main');
        if (!hasMainContext) {
            this.contexts.insert(
                {
                    type: 'main',
                    name: '<main>',
                },
                0,
            );
        }
        // <checkpoint> context is always at top, if exists
        const checkpointCtx = this.getCheckpointContext();
        if (checkpointCtx && checkpointCtx.$index !== 1) {
            this.contexts.move(checkpointCtx, 1);
        }
    }

    /**
     * Each script contains exactly one main context (conventionally rendered at the top
     * of the script tree) which is an entry point for "normal" execution
     * (i.e. execution which starts from the beginning, and not from the checkpoint).
     *
     * @public
     */
    getMainContext(): Context {
        const context = this.contexts.find(ctx => ctx.type === 'main');
        util.assertScript(context, 'No main context');
        return context!;
    }

    /**
     * Script may additionally contain a single checkpoint context which will be
     * executed when job is restarted with checkpoint.
     *
     * @beta
     */
    getCheckpointContext(): Context | null {
        return this.contexts.find(_ => _.type === 'checkpoint') || null;
    }

    /**
     * Looks up a context with specified `id`.
     *
     * @param id
     * @public
     */
    getContextById(id: string): Context | null {
        return this.contexts.find(ctx => ctx.id === id) || null;
    }

    /**
     * Returns the first action of main context.
     *
     * @public
     */
    getFirstAction(): Action | null {
        const mainContext = this.getMainContext();
        return mainContext.children.first;
    }

    /**
     * Looks up an action with specified `id`.
     *
     * @param id
     * @public
     */
    getActionById(id: string): Action | null {
        const obj = this.$ids.get(id);
        return obj instanceof Action ? obj : null;
    }

    /**
     * Looks up definition by specified `id`.
     * @param id
     * @public
     */
    getDefinitionById(id: string): DefinitionAction | null {
        const obj = this.$ids.get(id);
        return obj instanceof DefinitionAction ? obj : null;
    }

    /**
     * Looks up definition by specified `id`, throwing error if definition not found.
     * @param id
     */
    requireDefinition(id: string) {
        const def = this.getDefinitionById(id);
        util.assertScript(def != null, 'Definition not found');
        return def!;
    }

    /**
     * Traverses all script actions in depth-first order.
     *
     * @public
     */
    *allActions() {
        for (const context of this.contexts) {
            yield* context.descendentActions();
        }
    }

    // Runtime

    /**
     * Sets script playhead (actions to be played next).
     * Setting `null` indicates that the next script task will be context matching.
     *
     * Note: normal script playback manages playhead automatically accoding to the rules
     * specified in {@link Action}. In practice setting playhead is only required when
     * implementing custom control flow inside the actions; to do this an action
     * should override {@link Action.afterRun}.
     *
     * @param action
     * @public
     */
    setPlayhead(action: Action | null) {
        this.$playback.playhead = action;
    }

    /**
     * Sets script status. The typical use case for this is to implement custom success conditions
     * inside an action (either via JavaScript or an extension).
     *
     * Note: avoid setting `fail` status directly; instead throw an error.
     *
     * @param status
     * @public
     */
    setStatus(status: ScriptPlaybackStatus) {
        this.$playback.status = status;
        this.$events.emit('statusUpdated', status);
    }

    /**
     * Indicates whether the script is currently running.
     *
     * @public
     */
    isRunning() {
        return this.$playback.running;
    }

    /**
     * Indicates whether the script is currently paused.
     *
     * Note: pressing "Pause" button in Autopilot makes script paused,
     * but does not abort the script playback instantaneously.
     *
     * @public
     */
    isPaused() {
        return this.$playback.paused || !this.$playback.running;
    }

    /**
     * Pauses the script. This does not instantly terminate the currently running action,
     * so script becomes playable only after the current task is finished.
     *
     * @public
     */
    pause() {
        this.$playback.mode = 'action';
        this.$playback.paused = true;
    }

    /**
     * The ticks are used in long-running tasks (like context matching, 3dsecure resolution, retries, etc)
     * to periodically check if script execution has been interrupted.
     *
     * It is advisable to call `await tick()` inside any tasks that have loops or retries (or otherwise have
     * potential of running for long time). This way the embedder may override {@link FlowService.tick} to
     * specify custom termination logic (for example to abort script playback by external command) and thus
     * make it easier for a script to terminate.
     *
     * @public
     */
    async tick() {
        await this.$flow.tick(this);
    }

    /**
     * @internal
     */
    protected async beforeRun() {
        await this.$page.send('Network.setBlockedURLs', {
            urls: this.blockedUrlPatterns,
        });
        await this.$page.send('Network.setBypassServiceWorker', {
            bypass: true,
        });
        await this.executeOnScriptRunHandlers();
    }

    /**
     * Runs the script from specified `action`.
     * It is not possible to start more than one playback at a time.
     *
     * @param mode
     *  - `script` — play until either `success` or `fail` event occurs.
     *  - `context` — play till the end of the context
     *  - `action` — play single action only
     * @param action If specified, a playhead will be set to specified action.
     *  If `null` is specified, the script will resume from context matching.
     * @public
     */
    async run(mode: ScriptPlaybackMode = 'script', action: Action | null = this.$playback.playhead): Promise<void> {
        util.assertPlayback(!this.isRunning(), 'Cannot run: already running');

        this.$playback.paused = false;
        this.$playback.running = true;
        this.$playback.mode = mode;
        this.$playback.playhead = action;
        this.$playback.error = null;

        try {
            await this.beforeRun();
            while (!this.isPaused()) {
                await this._performCurrentTask();
            }
            this.$events.emit('success');
        } catch (error) {
            this.$playback.error = error;
            this.$playback.status = 'error';
            this.$events.emit('fail', error);
            throw error;
        } finally {
            this.$playback.running = false;
            this.$playback.mode = 'action';
            this.$playback.paused = false;
            this.$events.emit('done');
        }
    }

    /**
     * Shortcut for playing a single action.
     *
     * @public
     */
    async step() {
        await this.run('action');
    }

    /**
     * Shortcut for playing a script from top to bottom.
     *
     * @public
     */
    async runAll() {
        await this.run('script', this.getFirstAction());
    }

    /**
     * Runs inspections from registered inspections.
     */
    *inspect(): IterableIterator<InspectionReport> {
        const resolver = this.$engine.$resolver;
        const inspections = resolver.getInspectionClasses().map(cl => new cl(this));
        const scriptInspections = inspections.filter(_ => _ instanceof ScriptInspection);
        const contextInspections = inspections.filter(_ => _ instanceof ContextInspection);
        const actionInspections = inspections.filter(_ => _ instanceof ActionInspection);
        for (const insp of scriptInspections) {
            yield* this.collectReports(insp, this);
        }
        if (!contextInspections.length && !actionInspections.length) {
            return;
        }
        for (const context of this.contexts) {
            for (const insp of contextInspections) {
                yield* this.collectReports(insp, context);
            }
            if (!actionInspections.length) {
                continue;
            }
            for (const action of context.descendentActions()) {
                for (const insp of actionInspections) {
                    yield* this.collectReports(insp, action);
                }
            }
        }
    }

    protected *collectReports<T extends InspectionNode>(inspection: Inspection<T>, node: T): IterableIterator<InspectionReport> {
        for (const res of inspection.inspect(node)) {
            yield {
                action: node instanceof Action ? node as any : undefined,
                context: node instanceof Context ? node as any :
                    node instanceof Action ? node.$context : undefined,
                ...res
            };
        }
    }

    /**
     * Single iteration of script run loop.
     *
     * @internal
     */
    protected async _performCurrentTask(): Promise<void> {
        await this.tick();
        this.$events.emit('beforeCurrentTask');
        // Tick function or event handlers can pause script execution
        if (this.isPaused()) {
            return;
        }
        const action = this.$playback.playhead;
        if (action) {
            this.$playback.lastContext = action.$context;
            await action.run();
        } else {
            await this._enterNextContext();
        }
        this.$playback.running = this._shouldContinue();
    }

    /**
     * @internal
     */
    protected async _enterNextContext() {
        const context = await this.matchNextContext();
        context.enter();
        this.$playback.lastContext = context;
        await this.executeOnContextEnterHandlers(context);
        const label = context.name;
        await this.$reporter.sendScreenshot('debug', { label });
        await this.$reporter.sendHtmlSnapshot('debug');
    }

    /**
     * @internal
     */
    protected _shouldContinue() {
        if (this.$playback.paused) {
            return false;
        }
        switch (this.$playback.mode) {
            case 'action':
                return false;
            case 'context':
                return !!this.$playback.playhead;
            case 'script':
                return this.$playback.status !== 'success';
            default:
                return false;
        }
    }

    /**
     * @internal
     */
    protected async matchNextContext(): Promise<Context> {
        try {
            this.$playback.status = 'matching';
            for (const ctx of this.contexts) {
                ctx.resetMatchers();
            }
            const ctx = await this._matchNextContext();
            return ctx;
        } finally {
            this.$playback.status = 'idle';
        }
    }

    /**
     * Context matching logic. Too complicated to explain in docs, so following the code is advised.
     *
     * @internal
     */
    protected async _matchNextContext(): Promise<Context> {
        const contextMatchSlowMargin = this.$config.get(CONTEXT_MATCH_SLOW_MARGIN);
        const contextMatchInterval = this.$config.get(CONTEXT_MATCH_INTERVAL);

        const { lastContext } = this.$playback;
        const isSameCtx = (ctx: Context) => lastContext && lastContext.id === ctx.id;
        const isSlowMatch = (ctx: Context) => isSameCtx(ctx) || ctx.matchMode === 'slow';

        const timer = new ContextMatchTimer(this.$config, this.$page);
        let lastStableMatchAt = Date.now();
        let lastIds = '';

        while (!timer.checkExpired()) {
            await this.tick();
            // Wait for readiness before trying; report loading failures if any
            await this.$page.waitForReady({
                rejectNetworkErrors: true,
                rejectHttpErrors: false,
                rejectTimeout: false,
                timeout: 5000,
            });
            await new Promise(r => setTimeout(r, contextMatchInterval));
            // Run matchers
            const matchedContexts = await this.matchContexts(true);
            // See if result is different from previous match attempt
            const newIds = matchedContexts
                .map(ctx => ctx.id)
                .sort((a, b) => (a > b ? 1 : -1))
                .join(',');
            if (lastIds !== newIds) {
                // This means smth has changed (unstable), so we reset attempts counter
                lastIds = newIds;
                lastStableMatchAt = Date.now();
            }
            const isStable = Date.now() > lastStableMatchAt + contextMatchSlowMargin;
            // No contexts match so far, continue polling
            if (matchedContexts.length === 0) {
                continue;
            }
            // Check for slow match
            const matchSlowly = matchedContexts.some(ctx => isSlowMatch(ctx));
            if (matchSlowly && !isStable) {
                continue;
            }
            // Return first context
            return matchedContexts[0];
        }

        // Polling loop over
        throw await this.resolveContextMatchTimeoutError();
    }

    /**
     * Performs a single shot of context matching (i.e. filters context candidates,
     * executes their matchers in parallel and returns those whose matchers did not fail).
     *
     * @param filterByLimit If `true`, contexts with limits reached/exceeded will not participate in matching.
     * @public
     */
    async matchContexts(filterByLimit = true): Promise<Context[]> {
        const contexts = this.contexts.filter(context => {
            return context.type === 'context' && (!filterByLimit || !context.isLimitReached());
        });
        const matchResults = await Promise.all(contexts.map(context => context.runMatch()));
        const matchedContexts = [];
        for (const [i, ctx] of contexts.entries()) {
            if (matchResults[i]) {
                matchedContexts.push(ctx);
            }
        }
        return matchedContexts;
    }

    /**
     * @internal
     */
    protected async resolveContextMatchTimeoutError(): Promise<Error> {
        // Try matching everything to see if there's an error code on some of them
        const matchedContexts = await this.matchContexts(false);
        if (matchedContexts.length > 0) {
            const errorCode = matchedContexts.map(ctx => ctx.errorCode).find(Boolean);
            const message = `Context limit exceeded (${errorCode || 'no error code'})`;
            return util.createError({
                code: errorCode ?? 'ContextLimitError',
                message,
                retry: false,
                scriptError: errorCode != null,
                details: {
                    contexts: matchedContexts.map(ctx => {
                        return {
                            id: ctx.id,
                            name: ctx.name,
                        };
                    }),
                },
            });
        }
        return util.createError({
            code: 'NoContextsMatch',
            message: 'No contexts match',
            retry: false,
        });
    }

    /**
     * Searches script contexts, actions and pipes using internal query language.
     *
     * @param queries
     * @param options
     * @internal
     */
    search(queries: ScriptSearchQuery[], options: ScriptSearchOptions = {}): IterableIterator<ScriptSearchResult> {
        return new ScriptSearch(this).search(queries, options);
    }

    /**
     * @internal
     */
    *collectInputKeys() {
        for (const action of this.allActions()) {
            yield* action.collectInputKeys();
        }
    }

    /**
     * @internal
     */
    *collectOutputKeys() {
        for (const action of this.allActions()) {
            yield* action.collectOutputKeys();
        }
    }

    /**
     * @internal
     */
    *collectUsedDependencies() {
        const depNames: Set<string> = new Set(['<core>']);
        for (const dep of this.collectAllUsedDependencies()) {
            if (!depNames.has(dep.name)) {
                depNames.add(dep.name);
                yield dep;
            }
        }
    }

    /**
     * @internal
     */
    private *collectAllUsedDependencies(): Iterable<ExtensionVersion> {
        for (const action of this.allActions()) {
            const dep = action.$class.$extension;
            if (dep) {
                yield {
                    name: dep.spec.name,
                    version: dep.spec.version,
                };
            }
            for (const pipe of action.descendentPipes()) {
                const dep = pipe.$class.$extension;
                if (dep) {
                    yield {
                        name: dep.spec.name,
                        version: dep.spec.version,
                    };
                }
            }
        }
    }

    protected async executeOnScriptRunHandlers() {
        const promises = this.$engine.resolveSessionHandlers().map(async service => {
            try {
                if (service.onScriptRun) {
                    await service.onScriptRun(this);
                }
            } catch (error) {
                this.$logger.error('onScriptRun handler failed', {
                    serviceName: service.constructor.name,
                    error,
                });
            }
        });
        await Promise.all(promises);
    }

    protected async executeOnContextEnterHandlers(context: Context) {
        const promises = this.$engine.resolveSessionHandlers().map(async service => {
            try {
                if (service.onContextEnter) {
                    await service.onContextEnter(context);
                }
            } catch (error) {
                this.$logger.error('onContextEnter handler failed', {
                    serviceName: service.constructor.name,
                    error,
                });
            }
        });
        await Promise.all(promises);
    }

}

/**
 * @stable
 */
export interface ScriptInput {
    key: string;
    data: any;
}

/**
 * @stable
 */
export interface ScriptOutput {
    key: string;
    data: any;
}

/**
 * @stable
 */
export type ScriptPlaybackStatus = 'idle' | 'running' | 'matching' | 'error' | 'success';

/**
 * @stable
 */
export type ScriptPlaybackMode = 'action' | 'context' | 'script';

/**
 * @internal
 */
export interface ScriptPlaybackState {
    paused: boolean;
    running: boolean;
    mode: ScriptPlaybackMode;
    status: ScriptPlaybackStatus;
    error: Error | null;
    playhead: Action | null;
    lastContext: Context | null;
}
