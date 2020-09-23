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

import { Target } from './target';
import { FrameManager } from './frame-manager';
import { Frame, FrameNavigateOptions } from './frame';
import { InputManager } from './input-manager';
import { RemoteObject } from './remote-object';
import { RemoteElement } from './remote-element';
import { CdpFrameTree, CdpLayoutMetrics, CdpCookie } from './types';
import { NetworkManager } from './network-manager';
import { ScreenshotManager } from './screenshot-manager';
import { RemoteExpression } from './execution-context';
import { DomManager } from './dom';
import { Interceptor, InterceptorHandler } from './interceptor';

/**
 * Represents a page CDP target.
 *
 * This class takes care of various page lifecycle duties, which include:
 *
 *   - mirroring frame tree structure,
 *   - tracking execution contexts,
 *   - tracking network activity and interception,
 *   - maintaining emulation settings.
 *
 * A single page instance typically corresponds to a tab.
 */
export class Page {
    domManager: DomManager;
    frameManager: FrameManager;
    inputManager: InputManager;
    networkManager: NetworkManager;
    screenshotManager: ScreenshotManager;

    interceptors: Interceptor[] = [];

    private constructor(public target: Target, frameTree: CdpFrameTree) {
        this.domManager = new DomManager(this);
        this.frameManager = new FrameManager(this, frameTree);
        this.inputManager = new InputManager(this);
        this.networkManager = new NetworkManager(this);
        this.screenshotManager = new ScreenshotManager(this);
    }

    get browser() {
        return this.target.browser;
    }

    get logger() {
        return this.target.logger;
    }

    get toolkitBinding() {
        return this.browser.config.toolkitBinding;
    }

    static async create(target: Target): Promise<Page> {
        await target.send('Page.enable');
        const { frameTree } = await target.send('Page.getFrameTree');
        const page = new Page(target, frameTree);
        await target.send('Page.setLifecycleEventsEnabled', { enabled: true });
        await target.send('Network.enable', {
            // TODO make configurable
            maxTotalBufferSize: 100 * 1024 * 1204,
            maxResourceBufferSize: 50 * 1024 * 1204,
        });
        await target.send('Fetch.enable');
        // await target.send('Network.setCacheDisabled', { cacheDisabled: true });
        await target.send('Runtime.enable');
        await target.send('Animation.enable');
        await target.send('Animation.setPlaybackRate', {
            playbackRate: 1000,
        });
        target.browser.emit('pageCreated', page);
        return page;
    }

    async send(method: string, params?: any, timeout?: number): Promise<any> {
        return await this.target.send(method, params, timeout);
    }

    sendAndForget(method: string, params?: any): void {
        this.target.sendAndForget(method, params);
    }

    async activate() {
        await this.target.activate();
        await this.send('Page.bringToFront');
    }

    close() {
        this.target.close();
    }

    mainFrame(): Frame {
        return this.frameManager.mainFrame!;
    }

    allFrames(): IterableIterator<Frame> {
        return this.frameManager.frames.values();
    }

    url() {
        return this.mainFrame().url;
    }

    async navigate(url: string, options: FrameNavigateOptions = {}): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            this.target.send('Page.navigate', { url }).catch(reject);
            this.mainFrame().ready = false;
            this.mainFrame().loaded = false;
            this.mainFrame().response = null;
            this.waitForReady(options).then(resolve, reject);
        });
    }

    async waitForReady(options: FrameNavigateOptions = {}): Promise<void> {
        await this.mainFrame().waitForReady(options);
    }

    async waitForLoad(options: FrameNavigateOptions = {}): Promise<void> {
        await this.mainFrame().waitForLoad(options);
    }

    async waitForAnimationFrame(timeout: number = 1000): Promise<void> {
        await Promise.race([
            this.evaluate(() => {
                return new Promise(r => requestAnimationFrame(r));
            }),
            new Promise(r => setTimeout(r, timeout)),
        ]);
    }

    async evaluate(pageFn: RemoteExpression, ...args: any[]): Promise<RemoteObject> {
        return await this.mainFrame().evaluate(pageFn, ...args);
    }

    async evaluateElement(pageFn: RemoteExpression, ...args: any[]): Promise<RemoteElement | null> {
        return await this.mainFrame().evaluateElement(pageFn, ...args);
    }

    async evaluateJson(pageFn: RemoteExpression, ...args: any[]): Promise<any> {
        return await this.mainFrame().evaluateJson(pageFn, ...args);
    }

    async document(): Promise<RemoteElement> {
        return await this.mainFrame().document();
    }

    async querySelectorAll(selector: string): Promise<RemoteElement[]> {
        return (await this.document()).querySelectorAll(selector);
    }

    async querySelector(selector: string): Promise<RemoteElement | null> {
        return (await this.document()).querySelector(selector);
    }

    async getLayoutMetrics(): Promise<CdpLayoutMetrics> {
        return await this.send('Page.getLayoutMetrics');
    }

    async grabHtmlSnapshot(): Promise<string> {
        return await this.evaluateJson(toolkitBinding => {
            return (window as any)[toolkitBinding].htmlSnapshot();
        }, this.toolkitBinding);
    }

    async captureHtmlSnapshot(): Promise<string> {
        return await this.mainFrame().captureHtmlSnapshot();
    }

    async clearBrowsingData() {
        await this.send('Storage.clearDataForOrigin', {
            origin: '*',
            storageTypes: 'all',
        });
        await this.send('Network.clearBrowserCookies');
        // await this.send('Network.clearBrowserCache');
    }

    async resolveFrameById(frameId: string): Promise<Frame | null> {
        // Check if IFRAME is not isolated
        const existingFrame = this.frameManager.getFrameById(frameId);
        if (existingFrame) {
            return existingFrame;
        }
        // Isolated IFRAMES are separate targets
        const newPage = await this.browser.getPageForTarget(frameId);
        if (newPage) {
            return newPage.mainFrame();
        }
        return null;
    }

    async getAllCookies(): Promise<CdpCookie[]> {
        const { cookies } = await this.send('Network.getAllCookies');
        return cookies;
    }

    async setCookies(cookies: CdpCookie[]) {
        await this.send('Network.setCookies', { cookies });
    }

    async getFrameTree(): Promise<CdpFrameTree> {
        const { frameTree } = await this.send('Page.getFrameTree');
        return frameTree;
    }

    interceptRequests(handler: InterceptorHandler, label: string = '') {
        const interceptor = new Interceptor(this, handler, label);
        this.interceptors.push(interceptor);
        return interceptor;
    }

    *allInterceptors(): IterableIterator<Interceptor> {
        yield* this.browser.interceptors;
        yield* this.interceptors;
    }

    clearInterceptors(label: string = '') {
        this.interceptors = label ? this.interceptors.filter(_ => _.label !== label) : [];
    }
}
