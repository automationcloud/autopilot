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
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import * as util from '../util';

export class ListEvery extends Pipe {
    static $type = 'List.every';
    static $help = `
Returns a single #document element with boolean value.

The value is \`true\` if all of the results of inner pipeline is \`true\`.

Throws an error if the inner pipeline returns non-boolean value.
`;

    @params.Pipeline({ label: 'Value' })
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        let result = true;
        for (const el of inputSet) {
            const res = await pipeline.selectOne([el], ctx);
            util.checkType(res.value, 'boolean');
            if (!res.value) {
                result = false;
                break;
            }
        }
        return [await this.createDocument(result)];
    }
}
