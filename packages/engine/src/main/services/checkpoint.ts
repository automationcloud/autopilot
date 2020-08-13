import { injectable, inject } from 'inversify';
import { Exception, CdpCookie } from '@automationcloud/cdp';
import { BrowserService } from './browser';
import { GlobalValue, GlobalsService } from './globals';

/**
 * Manages checkpoints.
 *
 * Checkpoint is created explicitly in script via `checkpoint` action
 * and represents a place where job can be restarted from.
 * It contains all necessary parameters (url, method, cookies)
 * so that the worker could capture and subsequently replicate
 * the page state from it.
 */
@injectable()
export class CheckpointService {
    constructor(
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(GlobalsService)
        protected globals: GlobalsService,
    ) {}

    get page() {
        return this.browser.page;
    }

    async sendCheckpoint(_checkpointData: CheckpointData) {}

    async createCheckpoint(title: string): Promise<CheckpointData> {
        await this.page.target.refreshInfo();
        const { url } = this.page.target;
        const frame = this.page.mainFrame();
        const cookies = await this.page.getAllCookies();
        const postParams = [...new URLSearchParams(this.page.mainFrame().postData || '')];
        const rs = frame.getOriginatingRequest();
        const method = rs ? rs.request.method : 'GET';
        const { securityOrigin } = this.page.mainFrame();
        const localStorage = await this.getStorageItems({ securityOrigin, isLocalStorage: true });
        const sessionStorage = await this.getStorageItems({ securityOrigin, isLocalStorage: false });
        const globals = this.globals.values;
        return {
            method,
            url,
            title,
            cookies,
            postParams,
            localStorage,
            sessionStorage,
            globals,
        };
    }

    async restoreCheckpoint(checkpoint: CheckpointData) {
        const { cookies = [], localStorage = [], sessionStorage = [], globals = [] } = checkpoint;
        await this.page.clearBrowsingData();
        await this.page.setCookies(cookies);
        await this.page.navigate('about:blank');
        this.globals.values = globals;
        const { identifier } = await this.page.send('Page.addScriptToEvaluateOnNewDocument', {
            source: this.compileStorageRestoreScript(localStorage, sessionStorage),
        });
        await this.performCheckpointNavigation(checkpoint);
        await this.page.send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
    }

    private async performCheckpointNavigation(checkpoint: CheckpointData) {
        const { url, method = 'get', postParams = [] } = checkpoint;
        switch (method.toLowerCase()) {
            case 'get': {
                await this.page.navigate(url);
                break;
            }
            case 'post': {
                const document = await this.page.document();
                await document.sendPost(url, postParams);
                break;
            }
            default:
                throw new Exception({
                    name: 'CheckpointRestoreFailed',
                    message: `Unsupported method: ${method}`,
                    retry: false,
                });
        }
    }

    private async getStorageItems(storageId: CdpStorageId): Promise<Array<[string, string]>> {
        try {
            const data = await this.page.send('DOMStorage.getDOMStorageItems', { storageId });
            return data.entries;
        } catch (err) {
            // Can throw, checked experimentally
            if (err.message.includes('Frame not found')) {
                return [];
            }
            throw err;
        }
    }

    private compileStorageRestoreScript(
        localStorage: Array<[string, string]>,
        sessionStorage: Array<[string, string]>,
    ): string {
        const lines = [];
        for (const [key, value] of localStorage) {
            lines.push(`localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`);
        }
        for (const [key, value] of sessionStorage) {
            lines.push(`sessionStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`);
        }
        return lines.join('\n');
    }
}

export interface CheckpointData {
    method: string;
    url: string;
    title: string;
    cookies: CdpCookie[];
    postParams: Array<[string, string]>;
    localStorage: Array<[string, string]>;
    sessionStorage: Array<[string, string]>;
    globals: GlobalValue[];
}

export interface CdpStorageId {
    securityOrigin: string;
    isLocalStorage: boolean;
}
