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
