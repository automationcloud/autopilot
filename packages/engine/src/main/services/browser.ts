import {
    Browser,
    Page,
    CdpLoadingFailed,
    CdpResponseReceived,
    CdpRequestWillBeSent,
    Target,
    Configuration,
    Logger,
    numberConfig,
} from '@automationcloud/cdp';
import { injectable, inject } from 'inversify';
import { util } from '..';
import { SessionHandler } from '../session';

const CDP_TIMEOUT = numberConfig('CDP_TIMEOUT', 120000);
const NAVIGATION_TIMEOUT = numberConfig('NAVIGATION_TIMEOUT', 30000);
const CHROME_PORT = numberConfig('CHROME_PORT', 9123);

@injectable()
@SessionHandler()
export class BrowserService extends Browser {
    private _currentPage: Page | null = null;

    constructor(
        @inject(Logger)
        public logger: Logger,
        @inject(Configuration)
        protected _config: Configuration,
    ) {
        super(logger);
        this.syncConfig();
        this.on('pageCreated', this.onPageCreated.bind(this));
        this.on('targetAttached', this.onTargetAttached.bind(this));
        this.on('targetDetached', this.onTargetDetached.bind(this));
    }

    async onSessionStart() {
        // Note: don't remove interceptors here, because other components
        // may add them, resulting in race conditions
    }

    async onSessionFinish() {
        this.clearInterceptors();
    }

    syncConfig() {
        this.applyConfig({
            chromePort: this._config.get(CHROME_PORT),
            cdpTimeout: this._config.get(CDP_TIMEOUT),
            navigationTimeout: this._config.get(NAVIGATION_TIMEOUT),
        });
    }

    getChromePort() {
        return this._config.get(CHROME_PORT);
    }

    async attach(targetId: string): Promise<void> {
        this.detach();
        this._currentPage = await this.getPageForTarget(targetId);
        this.emit('attached');
    }

    isAttached(): boolean {
        return !!this._currentPage;
    }

    isAttachedTo(targetId: string): boolean {
        if (!this._currentPage) {
            return false;
        }
        return this._currentPage.target.targetId === targetId;
    }

    detach(): void {
        if (!this.isAttached()) {
            return;
        }
        this.emit('willDetach');
        this._currentPage = null;
        this.emit('detached');
    }

    get page() {
        util.assertPlayback(this._currentPage, `No attached targets`);
        return this._currentPage!;
    }

    getCurrentPage() {
        return this._currentPage;
    }

    async openNewTab() {
        const tab = await this.newTab();
        await this.attach(tab.target.targetId);
    }

    async closeOtherTabs() {
        const currentTarget = this.page.target;
        const pages = [...this.attachedPages()];
        for (const page of pages) {
            if (page.target.targetId !== currentTarget.targetId && page.target.type === 'page') {
                page.close();
            }
        }
    }

    protected onPageCreated(page: Page) {
        page.target.on('Network.requestWillBeSent', ev => this.onRequestWillBeSent(page, ev));
        page.target.on('Network.loadingFailed', ev => this.onLoadingFailed(page, ev));
        page.target.on('Network.responseReceived', ev => this.onResponseReceived(page, ev));
    }

    protected onRequestWillBeSent(_page: Page, _ev: CdpRequestWillBeSent) {
        // this.metrics.chromeRequestsTotal.incr();
    }

    protected onLoadingFailed(page: Page, ev: CdpLoadingFailed) {
        const rs = page.networkManager.getResourceById(ev.requestId);
        if (!rs) {
            return;
        }
        // Do not log ERR_ABORTED for specific types of requests
        const looksLikeAborted = !rs.errorText || rs.errorText === 'net::ERR_ABORTED';
        if (looksLikeAborted && ['Image', 'Font'].includes(rs.type)) {
            return;
        }
        // this.metrics.chromeRequestsFailed.incr();
        this.logger.warn('Request failed to load', {
            details: rs,
        });
    }

    protected onResponseReceived(page: Page, ev: CdpResponseReceived) {
        const rs = page.networkManager.getResourceById(ev.requestId);
        if (!rs) {
            return;
        }
        if (ev.response.status >= 400) {
            this.logger.warn('Request failed with HTTP error', {
                details: rs,
            });
        }
    }

    protected onTargetAttached(_target: Target) {
        // this.metrics.chromeAttachedTargets.set([...this.attachedTargets()].length);
    }

    protected onTargetDetached(_target: Target) {
        // this.metrics.chromeAttachedTargets.set([...this.attachedTargets()].length);
    }
}
