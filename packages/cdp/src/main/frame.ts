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

import { EventEmitter } from 'events';

import { Exception } from './exception';
import { ExecutionContext, RemoteExpression } from './execution-context';
import { runtimeScripts, stubScripts } from './inject';
import { NetworkResource } from './network-manager';
import { Page } from './page';
import { RemoteElement } from './remote-element';
import { RemoteObject } from './remote-object';
import { CdpFrame, CdpRequest, CdpResponse } from './types';
import { asyncRegexpReplace } from './util';

/**
 * Represents a single frame (may correspond to page's main frame or any of the child frames).
 */
export class Frame extends EventEmitter {
    childFrames: Set<Frame> = new Set();
    // Lifecycle state, synced via Page.* events
    loaded: boolean = false;
    ready: boolean = false;
    failed: boolean = false;
    url: string = '';
    securityOrigin: string = '';
    mimeType: string = '';
    // State inferred from network requests
    // Note: these are inferred from responseReceived which is fired before navigation event,
    // therefore it is necessary to preserve those _after_ frame navigated event occurs.
    // To mitigate that we reset this state on requestWillBeSent with type=Document.
    // This presents a possibility for the state to leak between navigations,
    // in case navigation happens without triggering the abovementioned requestWillBeSent.
    requestId: string | null = null;
    errorText: string | null = null;
    response: CdpResponse | null = null;
    postData?: string;

    protected _isolatedWorld: ExecutionContext | null = null;
    protected _defaultExecCtx: ExecutionContext | null = null;

    constructor(
        public page: Page,
        public frameId: string,
        public parentFrame?: Frame,
    ) {
        super();
        if (parentFrame) {
            parentFrame.childFrames.add(this);
        }
        this.clearExecutionContexts();
    }

    get logger() {
        return this.page.logger.child({
            frame: this.collectLogInfo(),
        });
    }

    isMainFrame() {
        return !this.parentFrame;
    }

    getOriginatingRequest(): NetworkResource | null {
        return this.page.networkManager.getResourceById(this.requestId || '');
    }

    async waitForReady(options: FrameNavigateOptions = {}): Promise<void> {
        await this.waitForEvents({
            events: ['ready', 'loaded'],
            ...options,
        });
    }

    async waitForLoad(options: FrameNavigateOptions = {}): Promise<void> {
        await this.waitForEvents({
            events: ['loaded'],
            ...options,
        });
    }

    private async waitForEvents(options: FrameWaitOptions): Promise<void> {
        const { stack } = new Error();
        const {
            events,
            rejectHttpErrors = true,
            rejectNetworkErrors = true,
            rejectTimeout = true,
            timeout = this.page.browser.config.navigationTimeout,
        } = options;
        const eventsHappened = events.some(ev => (this as any)[ev] === true);
        if (eventsHappened) {
            return;
        }
        await new Promise<void>((resolve, reject) => {
            const noun = this.isMainFrame() ? 'Page' : 'Frame';
            const cleanup = () => {
                clearTimeout(timer!);
                for (const ev of events) {
                    this.removeListener(ev, onResolve);
                }
            };
            const onTimeout = () => {
                cleanup();
                if (rejectTimeout) {
                    const err = new Exception({
                        name: 'NavigationTimeout',
                        message: `${noun} did not resolve to one of following states: ${events.join(', ')}`,
                        retry: false,
                        details: this.collectLogInfo(),
                    });
                    err.stack = stack;
                    reject(err);
                } else {
                    resolve();
                }
            };
            const onResolve = () => {
                cleanup();
                const { status } = this.response || { status: 0 };
                if (rejectHttpErrors && status! >= 400) {
                    const err = new Exception({
                        name: 'NavigationFailed',
                        message: `${noun} navigation failed with HTTP status ${status}`,
                        retry: false,
                        details: this.collectLogInfo(),
                    });
                    return reject(err);
                }
                if (rejectNetworkErrors && this.failed) {
                    const err = new Exception({
                        name: 'NavigationFailed',
                        message: `${noun} failed to load: ${this.errorText || '<reason unknown>'}`,
                        retry: false,
                        details: this.collectLogInfo(),
                    });
                    return reject(err);
                }
                resolve();
            };
            const timer = timeout ? setTimeout(onTimeout, timeout) : null;
            for (const ev of events) {
                this.addListener(ev, onResolve);
            }
        });
    }

    async getCurrentExecutionContext() {
        // Note: we can implement logic to switch between isolated world and default exec context here
        if (this._isolatedWorld && this._isolatedWorld.isAlive) {
            return this._isolatedWorld;
        }
        return await this.initIsolatedWorld();
    }

    protected async initIsolatedWorld() {
        const { executionContextId } = await this.page.target.send('Page.createIsolatedWorld', {
            frameId: this.frameId,
            worldName: 'Autopilot',
            grantUniveralAccess: true,
        });
        this._isolatedWorld = new ExecutionContext(this, executionContextId);
        this._isolatedWorld.initContentScripts(runtimeScripts);
        return this._isolatedWorld;
    }

    async getDefaultExecutionContext(): Promise<ExecutionContext> {
        if (!this._defaultExecCtx) {
            throw new Exception({
                name: 'NoExecutionContext',
                message: 'Default execution context is not ready',
                retry: true,
            });
        }
        return this._defaultExecCtx;
    }

    clearExecutionContexts() {
        this._defaultExecCtx = null;
        this._isolatedWorld = null;
    }

    async evaluate(pageFn: RemoteExpression, ...args: any[]): Promise<RemoteObject> {
        const execContext = await this.getCurrentExecutionContext();
        return await execContext.evaluate(pageFn, ...args);
    }

    async evaluateElement(pageFn: RemoteExpression, ...args: any[]): Promise<RemoteElement | null> {
        const execContext = await this.getCurrentExecutionContext();
        return await execContext.evaluateElement(pageFn, ...args);
    }

    async evaluateJson(pageFn: RemoteExpression, ...args: any[]): Promise<any> {
        const execContext = await this.getCurrentExecutionContext();
        return await execContext.evaluateJson(pageFn, ...args);
    }

    async document(): Promise<RemoteElement> {
        try {
            return (await this.evaluateElement(() => document))!;
        } catch (err) {
            throw new Exception({
                name: 'PageLoadingFailed',
                message: 'Failed to obtain top frame document',
                retry: true,
                details: {
                    cause: {
                        message: err.message,
                        code: err.code,
                        details: err.details,
                    },
                },
            });
        }
    }

    async querySelectorAll(selector: string): Promise<RemoteElement[]> {
        return (await this.document()).querySelectorAll(selector);
    }

    async querySelector(selector: string): Promise<RemoteElement | null> {
        return (await this.document()).querySelector(selector);
    }

    onNavigated(cdpFrame: CdpFrame) {
        this.loaded = false;
        this.ready = false;
        this.failed = !!cdpFrame.unreachableUrl;
        this.url = cdpFrame.unreachableUrl || cdpFrame.url;
        this.securityOrigin = cdpFrame.securityOrigin;
        this.mimeType = cdpFrame.mimeType;
        this.emit('navigate');
        if (['iframe', 'page'].includes(this.page.target.type)) {
            this.logger.debug(`Navigate (${this.page.target.type}) ${this.url}`);
        }
    }

    onLifecycleEvent(lifecycleEvent: string) {
        switch (lifecycleEvent) {
            case 'init':
                this.ready = false;
                this.loaded = false;
                break;
            case 'DOMContentLoaded':
                this.ready = true;
                this.emit('ready');
                break;
            case 'load':
                this.ready = true;
                this.emit('ready');
                this.loaded = true;
                this.emit('loaded');
                break;
        }
    }

    onRequestWillBeSent(requestId: string, request: CdpRequest) {
        this.requestId = requestId;
        this.errorText = null;
        this.response = null;
        this.postData = request.postData;
    }

    onResponseReceived(requestId: string, response: CdpResponse) {
        if (this.requestId !== requestId) {
            return;
        }
        this.response = response;
    }

    onLoadingFailed(requestId: string, errorText: string) {
        if (this.requestId !== requestId) {
            return;
        }
        this.errorText = errorText;
    }

    async onLoadingFinished(_requestId: string) {}

    onStoppedLoading() {
        this.ready = true;
        this.loaded = true;
        this.emit('ready');
        this.emit('loaded');
    }

    onExecutionContextCreated(context: any) {
        const { id, auxData = {} } = context;
        if (auxData.isDefault) {
            const exCtx = new ExecutionContext(this, id);
            exCtx.initContentScripts(stubScripts);
            this._defaultExecCtx = exCtx;
        }
    }

    onExecutionContextDestroyed(executionContextId: string) {
        if (this._defaultExecCtx && this._defaultExecCtx.executionContextId === executionContextId) {
            this.clearExecutionContexts();
        }
    }

    onExecutionContextsCleared() {
        this.clearExecutionContexts();
    }

    collectLogInfo() {
        return {
            frameId: this.frameId,
            url: this.url,
            requestId: this.requestId,
        };
    }

    async captureHtmlSnapshot(): Promise<string> {
        await this.waitForReady({ timeout: 5000, rejectHttpErrors: false }).catch(_err => {});
        await this.htmlSnapshotPopulateFrameIds();
        const snapshot = await this.htmlSnapshotEvalWithFrameRefs();
        return await this.htmlSnapshotResolveFrameRefs(snapshot);
    }

    private async htmlSnapshotPopulateFrameIds(): Promise<void> {
        const frames = await this.querySelectorAll('iframe, frame');
        const nodeInfosPromises = frames.map(frame => this.page.send('DOM.describeNode', { objectId: frame.objectId }));
        const nodeInfos = await Promise.all(nodeInfosPromises);
        const frameIds = nodeInfos.map(nodeInfo => nodeInfo.node.frameId);
        await this.evaluateJson(
            (frameIds: string[], ...frames: any[]) => {
                for (let i = 0; i < frames.length; i++) {
                    frames[i].__ubioFrameId = frameIds[i];
                }
            },
            frameIds,
            ...frames,
        );
    }

    private async htmlSnapshotEvalWithFrameRefs(): Promise<string> {
        try {
            return await this.evaluateJson(toolkitBinding => {
                return (window as any)[toolkitBinding].htmlSnapshot();
            }, this.page.toolkitBinding);
        } catch (err) {
            return await this.evaluateJson(() => document.documentElement!.outerHTML);
        }
    }

    private async htmlSnapshotResolveFrameRefs(snapshot: string): Promise<string> {
        // See toolkit.ts for more info
        const frameMarkerRegex = /------@@(.*?):\d+@@------/g;
        const result = await asyncRegexpReplace(snapshot, frameMarkerRegex, async m => {
            const frameId = m[1];
            const frame = await this.page.resolveFrameById(frameId);
            if (!frame) {
                return 'data:text;frame content unavailable';
            }
            // Grab iframe snapshot, serialize it and insert as srcdoc
            const html = await frame.captureHtmlSnapshot();
            const htmlBase64 = Buffer.from(html).toString('base64');
            return `data:text/html;base64,${htmlBase64}"`;
        });
        return result;
    }
}

export interface FrameWaitOptions extends FrameNavigateOptions {
    events: Array<'ready' | 'loaded' | 'networkAlmostIdle' | 'networkIdle'>;
}

export interface FrameNavigateOptions {
    timeout?: number;
    rejectHttpErrors?: boolean;
    rejectNetworkErrors?: boolean;
    rejectTimeout?: boolean;
}
