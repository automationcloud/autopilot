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
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListSortBy extends Pipe {
    static $type = 'List.sortBy';
    static $help = `
For each element evaluates the key using inner pipeline,
then sorts the elements according to this key, in ascending order.

### Use For

- advanced scripting
`;

    @params.Pipeline({
        label: 'Key',
        help: 'Inner pipeline to evaluate sorting key.',
    })
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        const wraps = [];
        for (const el of inputSet) {
            const result = await pipeline.selectOne([el], ctx);
            const val = result.value;
            wraps.push({ el, val });
        }
        return wraps.sort((a, b) => (a.val > b.val ? 1 : -1)).map(w => w.el);
    }
}
