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

import { BrowserService, Target } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';

import { Controller, controller } from '../controller';
import { EventsController } from './events';

@injectable()
@controller({
    alias: 'feedback'
})
export class FeedbackController implements Controller {
    targetsWatched: Set<string> = new Set();

    constructor(
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(EventsController)
        protected events: EventsController
    ) {}

    async init() {
        this.browser.on('pageCreated', page => this.watchTarget(page.target));
        this.browser.on('targetDetached', target => this.unwatchTarget(target));
        this.browser.on('attached', () => this.invalidate());
        this.browser.on('willDetach', () => this.invalidate());
        if (this.browser.isAttached()) {
            this.watchTarget(this.browser.page.target);
        }
    }

    invalidate() {
        this.events.emit('feedbackInvalidated');
    }

    watchTarget(target: Target) {
        if (this.targetsWatched.has(target.targetId)) {
            return;
        }
        target.addListener('cdp.DOM', () => this.invalidate());
        target.addListener('cdp.Network', () => this.invalidate());
        this.invalidate();
    }

    unwatchTarget(target: Target) {
        this.targetsWatched.delete(target.targetId);
    }
}
