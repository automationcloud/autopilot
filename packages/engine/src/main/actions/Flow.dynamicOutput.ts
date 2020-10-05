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
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { params } from '../model';

export class DynamicOutput extends Action {
    static $type = 'Flow.dynamicOutput';
    static $icon = 'fas fa-share';
    static $help = `
Sends a dynamic Job Output, with both \`key\` and \`data\` being evaluated at runtime
rather than pre-defined at scripting time.

The pipeline should return a single element with \`key: string\` and \`data: any\`.
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    @params.Outcome({
        label: 'Output Result',
        placeholder: 'Run the action to see the output value.',
        outputKeyProp: '$outputKey',
    })
    $output: any = undefined;

    // For preview validation
    $outputKey: string = '';

    reset() {
        super.reset();
        this.$output = undefined;
        this.$outputKey = '';
    }

    async exec() {
        await this.retry(async () => {
            const el = await this.selectOne(this.pipeline);
            util.checkType(el.value, 'object', 'value');
            const { key, data } = el.value;
            util.assertPlayback(!!key, 'Key should be a non-empty string');
            util.assertPlayback(data !== undefined, 'Data should exist');
            util.checkType(key, 'string', 'value.key');
            this.$output = data;
            this.$outputKey = this.$script.hashInputOutputKey(key);
            await this.$script.sendOutput(key, data);
        });
    }
}
