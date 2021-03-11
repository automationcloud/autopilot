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

import { RuntimeCtx } from '../ctx';
import { Element } from '../element';
import { params } from '../model';
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import * as util from '../util';

export class ListRepeat extends Pipe {
    static $type = 'List.repeat';
    static $help = `
Creates specified number of copies of each input element.
`;

    @params.Pipeline({
        label: 'Count',
    })
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        const results = [];
        for (const el of inputSet) {
            const result = await pipeline.selectOne([el], ctx);
            util.checkType(result.value, 'number');
            for (let i = 0; i < result.value; i += 1) {
                results.push(el);
            }
        }
        return results;
    }
}
