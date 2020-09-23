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

import { injectable, inject } from 'inversify';
import { BrowserService } from './browser';
import { SessionHandler } from '../session';

export type EmulationMode = 'disabled' | 'mobile' | 'desktop';

/**
 * @internal
 */
@injectable()
@SessionHandler()
export class EmulationService {
    mode: EmulationMode = 'desktop';

    constructor(
        @inject(BrowserService)
        protected browser: BrowserService,
    ) {
        browser.on('attached', () => this.restore());
        browser.on('emulationInvalid', () => this.restore());
    }

    async onSessionStart() {
        await this.restore();
    }

    async onSessionFinish() {}

    isEnabled(): boolean {
        return this.mode !== 'disabled';
    }

    async setMode(mode: EmulationMode) {
        this.mode = mode;
        await this.restore();
    }

    async restore() {
        const page = this.browser.getCurrentPage();
        if (!page) {
            return;
        }
        try {
            const emulationSettings = this.getEmulationSettings();
            if (this.mode === 'disabled') {
                await page.send('Emulation.clearDeviceMetricsOverride');
            } else {
                await page.send('Emulation.setDeviceMetricsOverride', emulationSettings);
            }
        } catch (error) {
            if (['CdpDisconnected', 'CdpTargetDetached'].includes(error.name)) {
                // We're not interested in transient frames which unload too quickly
                return;
            }
            throw error;
        }
    }

    getEmulationSettings() {
        switch (this.mode) {
            case 'desktop':
                return {
                    width: 1270,
                    height: 712,
                    deviceScaleFactor: 1,
                    mobile: false,
                    scale: 1,
                };
            case 'mobile':
                return {
                    width: 375,
                    height: 667,
                    deviceScaleFactor: 1,
                    mobile: true,
                    scale: 1,
                    screenWidth: 375,
                    screenHeight: 667,
                };
            default:
                return {};
        }
    }
}
