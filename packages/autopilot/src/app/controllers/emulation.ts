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
import { controller } from '../controller';
import { StorageController } from './storage';
import {
    BrowserService,
    EmulationMode,
    EmulationService,
    stringConfig,
    EMULATION_MODE
} from '@automationcloud/engine';
import { SettingsController } from './settings';
import { EventsController } from '../controllers/events';

export type ThrottlingMode = 'none' | '3g' | '2g';

const THROTTLING_MODE = stringConfig('THROTTLING_MODE', 'none');

@injectable()
@controller({ alias: 'emulation', backgroundInit: true })
export class EmulationController {

    constructor(
        @inject(StorageController)
        protected storage: StorageController,
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(EmulationService)
        protected emulation: EmulationService,
        @inject(EventsController)
        protected events: EventsController,
        @inject(SettingsController)
        protected settings: SettingsController,
    ) {
        this.browser.on('attached', () => this.applyThrottling());
        this.events.on('settingsUpdated', () => this.init());
    }

    async init() {
        if (this.browser.isAttached()) {
            this.applyEmulation();
            this.applyThrottling();
        }
    }

    getEmulationMode() {
        return this.settings.get(EMULATION_MODE) as EmulationMode;
    }

    setEmulationMode(mode: EmulationMode) {
        this.settings.set(EMULATION_MODE, mode);
    }

    getThrottlingMode() {
        return this.settings.get(THROTTLING_MODE) as ThrottlingMode;
    }

    setThrottlingMode(mode: ThrottlingMode) {
        this.settings.set(THROTTLING_MODE, mode);
    }

    protected applyEmulation() {
        this.emulation.setMode(this.getEmulationMode());
    }

    protected applyThrottling() {
        this.browser.page
            .send('Network.emulateNetworkConditions', this.getThrottlingEmulationParams())
            .catch(err => console.warn('Apply throttling failed', err));
    }

    protected getThrottlingEmulationParams(): any {
        switch (this.getThrottlingMode()) {
            case '3g':
                return {
                    offline: false,
                    connectionType: 'cellular3g',
                    downloadThroughput: 188743.68,
                    uploadThroughput: 86400,
                    latency: 562.5,
                };
            case '2g':
                return {
                    offline: false,
                    connectionType: 'cellular2g',
                    downloadThroughput: 51200,
                    uploadThroughput: 51200,
                    latency: 2000,
                };
            case 'none':
            default:
                return {
                    offline: false,
                    downloadThroughput: 0,
                    uploadThroughput: 0,
                    latency: 0,
                };
        }
    }

}
