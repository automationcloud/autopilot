import { Connection } from './connection';
import { Page } from './page';
import { Target } from './target';

import fetch from 'node-fetch';
import { EventEmitter } from 'events';
import uuid from 'uuid';
import { Logger } from './logger';
import { Interceptor, InterceptorHandler } from './interceptor';

export interface BrowserConfig {
    chromePort: number;
    cdpTimeout: number;
    navigationTimeout: number;
    stableBoxTimeout: number;
    toolkitBinding: string;
}

/**
 * Manages connection to Chrome browser.
 *
 * A browser instance connects to Chrome via Chrome DevTools Protocol (CDP)
 * using WebSocket endpoint (which becomes available once you start Chrome
 * with `--remote-debugging-port` flag).
 *
 * Note: even though Chrome supports multiple CDP connections; it is rarely practical
 * to establish more than one. Therefore, browser instance is commonly
 * managed as a singleton.
 *
 * @public
 */
export class Browser extends EventEmitter {
    connection: Connection;
    config: BrowserConfig;
    logger: Logger;
    interceptors: Interceptor[] = [];

    constructor(logger: Logger, config: Partial<BrowserConfig> = {}) {
        super();
        this.config = {
            chromePort: 9222,
            cdpTimeout: 60000,
            navigationTimeout: 30000,
            stableBoxTimeout: 5000,
            toolkitBinding: uuid.v4(),
            ...config,
        };
        this.connection = new Connection(this);
        this.logger = logger;
    }

    applyConfig(config: Partial<BrowserConfig>) {
        Object.assign(this.config, config);
    }

    async connect() {
        if (this.connection.isConnected()) {
            return;
        }
        const version = await this.getVersion();
        await this.connection.connect(version.webSocketDebuggerUrl);
        await this.send('Target.setDiscoverTargets', { discover: true });
    }

    async close() {
        await this.send('Browser.close');
    }

    disconnect() {
        this.connection.disconnect();
    }

    isConnected() {
        return this.connection.isConnected();
    }

    async newTab(browserContextId?: string): Promise<Page> {
        const { targetId } = await this.send('Target.createTarget', {
            url: 'about:blank',
            browserContextId,
        });
        const target = await this.connection.waitForTarget(targetId);
        return await target.getPage();
    }

    closeAllTabs() {
        for (const target of this.attachedTargets()) {
            if (target.type === 'page') {
                target.close();
            }
        }
    }

    getTarget(targetId: string): Target | null {
        for (const target of this.attachedTargets()) {
            if (target.targetId === targetId) {
                return target;
            }
        }
        return null;
    }

    async getPageForTarget(targetId: string): Promise<Page | null> {
        const target = this.getTarget(targetId);
        if (target && target.isPageTarget()) {
            return await target.getPage();
        }
        return null;
    }

    attachedTargets(): IterableIterator<Target> {
        return this.connection.sessions.values();
    }

    *attachedPages(): IterableIterator<Page> {
        for (const target of this.attachedTargets()) {
            if (target.attachedPage) {
                yield target.attachedPage;
            }
        }
    }

    async send(method: string, params?: any): Promise<any> {
        return await this.connection.send({ method, params });
    }

    sendAndForget(method: string, params?: any): void {
        this.connection.sendAndForget({
            method,
            params,
        });
    }

    async http(pathname: string, readJson: boolean = true) {
        const port = this.config.chromePort;
        const url = `http://localhost:${port}${pathname}`;
        const res = await fetch(url);
        return readJson ? await res.json() : await res.text();
    }

    async getVersion(): Promise<BrowserVersion> {
        const res = await this.http('/json/version');
        return {
            browserVersion: res['Browser'],
            protocolVersion: res['Protocol-Version'],
            userAgent: res['User-Agent'],
            v8Version: res['V8-Version'],
            webkitVersion: res['WebKit-Version'],
            webSocketDebuggerUrl: res['webSocketDebuggerUrl'],
        };
    }

    async createBrowserContext(): Promise<{ browserContextId: string }> {
        const { browserContextId } = await this.send('Target.createBrowserContext');
        return { browserContextId };
    }

    async disposeBrowserContext(browserContextId: string) {
        await this.send('Target.disposeBrowserContext', { browserContextId });
    }

    interceptRequests(handler: InterceptorHandler, label: string = '') {
        const interceptor = new Interceptor(this, handler, label);
        this.interceptors.push(interceptor);
        return interceptor;
    }

    clearInterceptors(label: string = '') {
        this.interceptors = label ? this.interceptors.filter(_ => _.label !== label) : [];
    }
}

export interface BrowserVersion {
    browserVersion: string;
    protocolVersion: string;
    userAgent: string;
    v8Version: string;
    webkitVersion: string;
    webSocketDebuggerUrl: string;
}
