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

export class BooleanOr extends Pipe {
    static $type = 'Boolean.or';
    static $help = `
Evaluates two operands by passing each element of input set through two different pipelines,
then returns \`false\` if both operands are \`false\`, and \`true\` otherwise.

Inner pipelines should return a single element for each element in input set.
An error is thrown if the result is not a boolean.

### Use For

- combining multiple booleans using logical OR (conjunction)
`;

    @params.Pipeline({ label: 'Operand A' })
    pipelineA!: Pipeline;
    @params.Pipeline({ label: 'Operand B' })
    pipelineB!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipelineA = this.pipelineA;
        const pipelineB = this.pipelineB;
        return await this.map(inputSet, async el => {
            const a = await pipelineA.selectOne([el], ctx);
            const b = await pipelineB.selectOne([el], ctx);
            util.checkType(a.value, 'boolean');
            util.checkType(b.value, 'boolean');
            const val = a.value || b.value;
            return el.clone(val);
        });
    }
}
