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

import { Action } from '../action';
import { params } from '../model';
import { Pipeline } from '../pipeline';
import * as util from '../util';

export class AppendGlobalAction extends Action {
    static $type = 'Global.appendGlobal';
    static $icon = 'fas fa-globe';
    static $help = `
Evaluates pipeline and appends resulting values to Global variable, which should contain an array.

If no global with specified key exists yet, creates an empty array before appending to it.
`;

    @params.String({ source: 'globals' })
    key: string = '';

    @params.Pipeline()
    pipeline!: Pipeline;

    async exec() {
        util.assertScript(this.key, 'key is required');
        await this.retry(async () => {
            const els = await this.selectAll(this.pipeline);
            const values = els.map(_ => _.value);
            this.$script.appendGlobal(this.key, values);
        });
    }
}
