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

import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import { Pipeline } from '../pipeline';
import * as util from '../util';

export class GetInputDynamicPipe extends Pipe {
    static $type = 'Value.getDynamicInput';
    static $help = `
Returns the value of specified Job Input.
The input key is evaluated using nested pipeline.
`;

    @params.Pipeline({
        label: 'Key',
        help: 'Pipeline for evaluating key, executed per each element.',
    })
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        return await this.map(inputSet, async el => {
            const res = await pipeline.selectOne([el], ctx);
            util.checkType(res.value, 'string');
            const data = await this.$script.requestInput(res.value);
            return el.clone(data);
        });
    }
}
