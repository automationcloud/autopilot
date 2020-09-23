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

import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListFilterOne extends Pipe {
    static $type = 'List.filterOne';
    static $help = `
Same as \`List.filter\`, but expects exactly one element.
`;

    @params.Pipeline({
        label: 'Condition',
    })
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        util.assertScript(pipeline.length, 'No pipes defined');
        const results = [];
        for (const el of inputSet) {
            const result = await pipeline.selectOne([el], ctx);
            util.checkType(result.value, 'boolean');
            if (result.value) {
                results.push(el);
            }
        }
        if (results.length !== 1) {
            throw util.playbackError(`Expected a single element, found ${results.length}`);
        }
        return results;
    }
}
