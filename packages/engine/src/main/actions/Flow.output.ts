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

export class FlowOutput extends Action {
    static $type = 'Flow.output';
    static $icon = 'fas fa-share';
    static $help = `
Sends Job Output with specified Output Key.

The pipeline should return a single element.
Its value will be sent as output data.

Note: multiple elements are not automatically serialized to arrays;
use Fold Array to send arrays instead.

### Parameters

- output key
`;

    @params.String({ source: 'outputs' })
    outputKey: string = '';

    @params.Pipeline()
    pipeline!: Pipeline;

    @params.Outcome({
        label: 'Output Result',
        placeholder: 'Run the action to see the output value.',
        outputKeyProp: 'outputKey',
    })
    $output: any = undefined;

    getLabel() {
        return this.outputKey;
    }

    reset() {
        super.reset();
        this.$output = undefined;
    }

    *collectOutputKeys(): IterableIterator<string> {
        yield this.outputKey;
    }

    async exec() {
        util.assertScript(this.outputKey, 'Output key is not specified');
        await this.retry(async () => {
            const el = await this.selectOne(this.pipeline);
            this.$output = el.value;
            await this.$script.sendOutput(this.outputKey, el.value);
        });
    }
}
