// Copyright 2020 Ubio Limited
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

import { App } from '../app';
import { Element, ActionList } from '@automationcloud/engine';
import debounce from 'debounce-promise';

export class Feedback {
    actionList: ActionList | null = null;
    refreshing: boolean = true;
    inputSet: Element[] = [];
    error: any | null = null;

    listener: () => Promise<void>;

    constructor(
        protected app: App,
    ) {
        this.refresh = debounce(this.refresh, 300, { leading: true });
        this.listener = () => this.refresh();
        app.events.addListener('feedbackInvalidated', this.listener);
    }

    destroy() {
        this.app.events.removeListener('feedbackInvalidated', this.listener);
    }

    set(actionList: ActionList | null) {
        this.actionList = actionList;
        this.refresh();
    }

    async refresh() {
        if (!this.actionList) {
            return;
        }
        if (!this.app.browser.isAttached()) {
            return;
        }
        this.refreshing = true;
        try {
            this.error = null;
            this.inputSet = await this.actionList.resolveScope();
        } catch (err) {
            this.error = err;
            this.inputSet = [];
        } finally {
            this.refreshing = false;
        }
    }

}
