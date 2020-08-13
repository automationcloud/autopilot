import { Browser, Page } from '../main';
import assert from 'assert';
import { logger } from './logger';

const chromePort = Number(process.env.CHROME_PORT) || 9123;

export class TestRuntime {
    browser: Browser;
    currentTab: Page | null = null;
    baseUrl: string = process.env.TEST_SERVER_URL || 'http://localhost:3007';

    constructor() {
        this.browser = new Browser(logger, {
            chromePort,
        });
    }

    get page() {
        assert(this.currentTab, 'No current tab; please make sure test runtime is connected to a page');
        return this.currentTab!;
    }

    getUrl(url: string): string {
        return `${this.baseUrl}${url}`;
    }

    async goto(url: string, options?: any) {
        await this.page.navigate(this.getUrl(url), options);
    }

    async openNewTab() {
        const { browserContextId } = await this.browser.createBrowserContext();
        const tab = await this.browser.newTab(browserContextId);
        this.currentTab = tab;
    }

    async closeTab() {
        const { currentTab } = this;
        if (currentTab) {
            await currentTab.close();
            const { browserContextId } = currentTab.target;
            if (browserContextId) {
                await this.browser.disposeBrowserContext(browserContextId);
            }
        }
        this.currentTab = null;
    }
}
