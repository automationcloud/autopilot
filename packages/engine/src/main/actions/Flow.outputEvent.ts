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

export class OutputEvent extends Action {
    static $type = 'Flow.outputEvent';
    static $icon = 'fas fa-share';
    static $help = `
Emits a Job Event Output with \`type\` and other arbitrary properties. The output key looks like \`events:<random-id>\`.

The pipeline can return a single element with \`type: string\` and other data fields.
If \`type\` is omitted, it will use the predefined type field. Note that evaluated value from pipeline will take precedence over predefined value.
`;

    @params.String({ label: 'Type' })
    eventType: string = '';

    @params.Pipeline()
    pipeline!: Pipeline;

    @params.Outcome({
        label: 'Result',
        placeholder: 'Run the action to see the output value.',
        outputKeyProp: '$outputKey',
    })
    $output: any = undefined;

    // This is needed so that output validation works
    $outputKey: string = '';

    reset() {
        super.reset();
        this.$output = undefined;
        this.$outputKey = '';
    }

    async exec() {
        await this.retry(async () => {
            const el = await this.selectOne(this.pipeline);
            const value = el.value ?? {};
            util.checkType(value, 'object', 'value');
            const data = {
                type: this.eventType,
                ...value,
            };
            util.assertPlayback(!!data.type, 'type should be a non-empty string');
            util.checkType(data.type, 'string', 'type');
            this.$output = data;
            this.$outputKey = this.$script.hashInputOutputKey(`events:${Math.random()}`);
            await this.$script.sendOutput(this.$outputKey, data);
        });
    }
}
