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
    BrowserService,
    Configuration,
    Logger,
    CdpRequestWillBeSent,
    Page
} from '@automationcloud/engine';
import { inject, injectable } from 'inversify';
import { controller } from '../controller';
import { EventsController } from '../controllers/events';

@injectable()
@controller({ alias: 'browser' })
export class AutopilotBrowserService extends BrowserService {
    visitedOrigins: string[] = [];

    constructor(
        @inject(Configuration)
        config: Configuration,
        @inject(Logger)
        logger: Logger,
        @inject(EventsController)
        events: EventsController,
    ) {
        super(logger, config);
        this.on('attached', () => this.page.domManager.enable());
        events.on('settingsUpdated', () => this.syncConfig());
        for (const page of this.attachedPages()) {
            this.monitorPage(page);
        }
        this.on('pageCreated', (page: Page) => this.monitorPage(page));
    }

    async init() {
        this.syncConfig();
    }

    protected monitorPage(page: Page) {
        page.target.on('Network.requestWillBeSent', ev => this.onRequestWillBeSent(page, ev));
    }

    protected onRequestWillBeSent(page: Page, ev: CdpRequestWillBeSent) {
        try {
            const url = new URL(ev.request.url);
            // data urls don't have origin, so URL will contain "null" (string)
            if (!url.host) {
                return;
            }
            if (!this.visitedOrigins.includes(url.origin)) {
                this.visitedOrigins.push(url.origin);
            }
        } catch (error) {
            this.logger.info(' Failed to log visited origin', { error });
        }
    }
}
