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

export class ListTakeWhile extends Pipe {
    static $type = 'List.takeWhile';
    static $help = `
Starting in specified direction, takes input elements whilst inner pipeline produces \`true\`, and discards the rest.

Unlike Filter, which discards all non-matching elements, this pipe
only discards a continuous sequence of elements either at the start or at the end.

### See Also

- Skip While: for opposite effect.
`;

    @params.Pipeline({ label: 'Condition' })
    pipeline!: Pipeline;

    @params.Enum({
        enum: [
            { label: 'left to right', value: 'ltr' },
            { label: 'right to left', value: 'rtl' },
        ],
    })
    direction: string = 'ltr';

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        const direction = this.direction;
        const rtl = direction === 'rtl';
        util.assertScript(pipeline.length, 'No pipes defined');
        const results = [];
        const collection = rtl ? inputSet.slice().reverse() : inputSet;
        for (const el of collection) {
            const result = await pipeline.selectOne([el], ctx);
            util.checkType(result.value, 'boolean');
            if (result.value) {
                results.push(el);
            } else {
                break;
            }
        }
        return rtl ? results.reverse() : results;
    }
}
