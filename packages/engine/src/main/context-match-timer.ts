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

import { Page, numberConfig, Configuration } from '@automationcloud/cdp';

const CONTEXT_MATCH_TIMEOUT_MAX = numberConfig('CONTEXT_MATCH_TIMEOUT_MAX', 3 * 60000);
const CONTEXT_MATCH_TIMEOUT_LOADED = numberConfig('CONTEXT_MATCH_TIMEOUT_LOADED', 60000);
const CONTEXT_MATCH_TIMEOUT_IDLE = numberConfig('CONTEXT_MATCH_TIMEOUT_IDLE', 15000);

/**
 * A timer used during context match that dynamically adjusts accoring to
 * the state of page loading and network.
 */
export class ContextMatchTimer {
    maxTimeoutAt: number;
    currentTimeoutAt: number;
    wasLoaded: boolean = false;
    wasIdle: boolean = false;

    constructor(public config: Configuration, public page: Page) {
        this.maxTimeoutAt = Date.now() + config.get(CONTEXT_MATCH_TIMEOUT_MAX);
        this.currentTimeoutAt = this.maxTimeoutAt;
    }

    checkExpired(): boolean {
        // Check the state of main frame and all connected frames
        const loaded = this.page.mainFrame().loaded;
        const networkIdle = [...this.page.browser.attachedPages()].every(p => p.networkManager.isSilent());
        const idle = loaded && networkIdle;
        if (!this.wasLoaded && loaded) {
            this.wasLoaded = true;
            this.adjustTimeout(this.config.get(CONTEXT_MATCH_TIMEOUT_LOADED));
        }
        if (!this.wasIdle && idle) {
            this.wasIdle = true;
            this.adjustTimeout(this.config.get(CONTEXT_MATCH_TIMEOUT_IDLE));
        }
        if (!loaded) {
            this.wasLoaded = false;
            this.wasIdle = false;
            this.adjustTimeout(this.config.get(CONTEXT_MATCH_TIMEOUT_MAX));
        }
        return Date.now() > this.currentTimeoutAt;
    }

    adjustTimeout(newTimeout: number) {
        this.currentTimeoutAt = Math.min(Date.now() + newTimeout, this.maxTimeoutAt);
    }
}
