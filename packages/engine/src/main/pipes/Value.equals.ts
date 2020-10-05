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
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';

export class ValueEquals extends Pipe {
    static $type = 'Value.equals';
    static $help = `
Evaluates two operands by passing each element of input set through two different pipelines,
then returns a boolean indicating whether the resulting values are conceptually equal.

The equality is tested according to following rules:

- strings are compared ignoring case, diacritics and extraneous whitespace
- objects are compared key-by-key recursively (deep equality), keys are compared strictly
- arrays are compared element-wise
- all other data types are coerced to strings and compared according the above rules

Inner pipelines should return a single element for each element in input set.

### Use For

- general purpose equality tests
- filtering by matching data from various sources
  (e.g. one of the operands may obtain Job Inputs to test input values against)

### See Also

- Euqals Text: for simpler alternative when one of the operands is a string constant
`;

    @params.Pipeline()
    pipelineA!: Pipeline;
    @params.Pipeline()
    pipelineB!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipelineA = this.pipelineA;
        const pipelineB = this.pipelineB;
        return await this.map(inputSet, async el => {
            const a = await pipelineA.selectOne([el], ctx);
            const b = await pipelineB.selectOne([el], ctx);
            const val = util.anyEquals(a.value, b.value);
            return el.clone(val);
        });
    }
}
