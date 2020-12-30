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

import { ApiRequest, BrowserService } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';
import { instanceId } from '../globals';
import os from 'os';
import { controller } from '../controller';
import { EventsController } from '../controllers/events';

// eslint-disable-next-line import/no-commonjs
const pkg = require('../../../package.json');

const startedAt = Date.now();

@injectable()
@controller()
export class AutopilotStatsController {

    constructor(
        @inject(ApiRequest)
        protected apiRequest: ApiRequest,
        @inject(EventsController)
        protected events: EventsController,
        @inject(BrowserService)
        protected browser: BrowserService,
    ) {}

    async init() {
        this.events.on('initialized', () => this.trackInstance());
    }

    async trackInstance() {
        try {

            await this.apiRequest.post('/AutopilotStats/trackInstance', {
                body: {
                    instanceId,
                    version: pkg.version,
                    chromeVersion: await this.getBrowserVersion(),
                    platform: os.platform(),
                    cpuCores: os.cpus().length,
                    startupTime: Date.now() - startedAt,
                }
            });
        } catch (error) {
            console.warn('Cannot report stats', error);
        }
    }

    protected async getBrowserVersion() {
        try {
            const info = await this.browser.getVersion();
            return info.browserVersion;
        } catch (error) {
            return 'unknown';
        }
    }

}
