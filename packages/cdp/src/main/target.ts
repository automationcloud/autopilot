import { EventEmitter } from 'events';
import { Browser } from './browser';
import { Exception } from './exception';
import { CdpTargetInfo, CdpTargetType } from './types';
import { Page } from './page';

export class Target extends EventEmitter {
    browser!: Browser;
    targetId: string;
    type: CdpTargetType;
    url: string;
    title: string;
    sessionId: string;
    browserContextId: string | null;

    attachedPage: Page | null = null;
    pagePromise: Promise<Page> | null = null;

    constructor(browser: Browser, sessionId: string, targetInfo: CdpTargetInfo) {
        super();
        Object.defineProperties(this, {
            browser: {
                get: () => browser,
                enumerable: false,
            },
        });
        this.sessionId = sessionId;
        this.targetId = targetInfo.targetId;
        this.type = targetInfo.type;
        this.url = targetInfo.url;
        this.title = targetInfo.title;
        this.browserContextId = targetInfo.browserContextId || null;
        browser.connection.sessions.set(sessionId, this);
        this.on('Inspector.targetCrashed', () => this.onTargetCrashed());
    }

    get logger() {
        return this.browser.logger.child({
            target: this.collectInfo(),
        });
    }

    getPage(): Promise<Page> {
        if (!this.pagePromise) {
            this.pagePromise = Page.create(this).then(page => {
                this.attachedPage = page;
                return page;
            });
        }
        return this.pagePromise;
    }

    async activate() {
        const { targetId } = this;
        await this.browser.send('Target.activateTarget', { targetId });
    }

    close() {
        const { targetId } = this;
        this.browser.sendAndForget('Target.closeTarget', { targetId });
    }

    async send(method: string, params?: any, timeout?: number) {
        const { sessionId } = this;
        return await this.browser.connection.send({
            method,
            params,
            sessionId,
            timeout,
        });
    }

    sendAndForget(method: string, params?: any) {
        const { sessionId } = this;
        this.browser.connection.sendAndForget({
            method,
            params,
            sessionId,
        });
    }

    updateInfo(targetInfo: CdpTargetInfo) {
        this.type = targetInfo.type;
        this.url = targetInfo.url;
        this.title = targetInfo.title;
    }

    onInfoChanged(targetInfo: CdpTargetInfo) {
        this.updateInfo(targetInfo);

        // CDP doesn't send notifications on title changes, so we'll just ask
        // target to refresh its info once, after the initial status change
        setTimeout(() => this.refreshInfo().catch(() => {}), 1000);
    }

    async refreshInfo() {
        const { targetInfo } = await this.send('Target.getTargetInfo');
        this.updateInfo(targetInfo);
    }

    private onTargetCrashed() {
        const { sessionId } = this;
        const err = new Exception({
            name: 'CdpTargetCrashed',
            message: 'CDP: Target crashed unexpectedly',
        });
        this.browser.connection.rejectAllForTarget(sessionId, () => err);
        this.emit('crash');
    }

    isPageTarget() {
        return ['iframe', 'page', 'background_page'].includes(this.type);
    }

    isValidTarget(): boolean {
        if (!this.isPageTarget()) {
            return false;
        }
        // Chrome currently leaks targets on Linux and Windows, so these are
        // heuristics to avoid sending commands to dysfunctional targets
        if (this.type === 'page') {
            return !!this.url && this.url !== 'about:blank';
        }
        return true;
    }

    collectInfo() {
        return {
            targetId: this.targetId,
            sessionId: this.sessionId,
            url: this.url,
            type: this.type,
            title: this.title,
        };
    }
}
