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

import { Configuration, Logger, stringConfig, Target } from '@automationcloud/cdp';
import { inject, injectable } from 'inversify';

import { SessionHandler } from '../session';
import { BrowserService } from './browser';

export type EmulationMode = 'disabled' | 'mobile' | 'desktop';

export const EMULATION_MODE = stringConfig('EMULATION_MODE', 'desktop');

/**
 * @internal
 */
@injectable()
@SessionHandler()
export class EmulationService {
    mode: EmulationMode;

    constructor(
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(Configuration)
        protected config: Configuration,
        @inject(Logger)
        protected logger: Logger,
    ) {
        browser.on('targetAttached', (target: Target) => this.applyToTarget(target));
        browser.on('emulationInvalid', () => this.applyToAllTargets());
        this.mode = this.getDefaultEmulationMode();
    }

    getDefaultEmulationMode() {
        return this.config.get(EMULATION_MODE) as EmulationMode;
    }

    async onSessionStart() {
        this.mode = this.getDefaultEmulationMode();
        await this.applyToAllTargets();
    }

    isEnabled(): boolean {
        return this.mode !== 'disabled';
    }

    setMode(mode: EmulationMode) {
        this.mode = mode;
        this.browser.emit('emulationInvalid');
    }

    async applyToAllTargets() {
        for (const target of this.browser.attachedTargets()) {
            await this.applyToTarget(target);
        }
    }

    async applyToTarget(target: Target) {
        if (target.type !== 'page') {
            return;
        }
        try {
            if (this.mode === 'disabled') {
                await target.send('Emulation.clearDeviceMetricsOverride');
            } else {
                const emulationSettings = this.getEmulationSettings();
                await target.send('Emulation.setDeviceMetricsOverride', emulationSettings);
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
