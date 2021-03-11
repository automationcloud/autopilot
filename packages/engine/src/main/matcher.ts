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

import { Exception } from '@automationcloud/cdp';

import { Action } from './action';
import { params } from './model';
import { Pipeline } from './pipeline';
import * as util from './util';

export class MatcherAction extends Action {
    static $type = 'matcher';
    static $icon = 'fas fa-check';
    static $hidden = true;

    @params.Pipeline()
    pipeline!: Pipeline;

    async performMatch(): Promise<void> {
        await this._trackRuntimeStats(() => this.performCheck());
    }

    async exec() {
        await this.performCheck();
    }

    async performCheck() {
        const el = await this.selectSingle(this.pipeline, false);
        util.checkType(el!.value, 'boolean');
        if (!el!.value) {
            throw new Exception({
                name: 'MatchFailed',
                message: 'Matcher failed to match',
                retry: false,
            });
        }
    }
}
