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

import {
    Browser,
    Configuration,
    Logger,
    numberConfig,
    Page,
    stringConfig,
    Target,
} from '@automationcloud/cdp';
import { inject, injectable } from 'inversify';

import { util } from '..';
import { SessionHandler } from '../session';

const CDP_TIMEOUT = numberConfig('CDP_TIMEOUT', 120000);
const NAVIGATION_TIMEOUT = numberConfig('NAVIGATION_TIMEOUT', 30000);
const CHROME_PORT = numberConfig('CHROME_PORT', 9123);
const CHROME_ADDRESS = stringConfig('CHROME_ADDRESS', '127.0.0.1');

@injectable()
@SessionHandler()
export class BrowserService extends Browser {
    private _currentPage: Page | null = null;

    constructor(
        @inject(Logger)
        logger: Logger,
        @inject(Configuration)
        protected _config: Configuration,
    ) {
        super({ logger });
        this.syncConfig();
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
            chromeAddress: this._config.get(CHROME_ADDRESS),
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

    protected onTargetAttached(_target: Target) {}
    protected onTargetDetached(_target: Target) {}
}
