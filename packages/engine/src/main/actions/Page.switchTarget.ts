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

import { Action } from '../action';
import { Pipeline } from '../pipeline';
import { params } from '../model';

export class SwitchTargetAction extends Action {
    static $type = 'Page.switchTarget';
    static $icon = 'fas fa-window-restore';
    static $help = '';

    @params.Pipeline()
    pipeline!: Pipeline;
    @params.Boolean()
    closeOtherTabs: boolean = false;

    async exec() {
        await this.retry(async () => {
            const el = await this.selectOne(this.pipeline);
            const { targetId } = el.page.target;
            await this.$browser.attach(targetId);
            await this.$page.activate();
            if (this.closeOtherTabs) {
                await this.$browser.closeOtherTabs();
            }
        });
    }
}
