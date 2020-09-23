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

export class EvalIfElse extends Pipe {
    static $type = 'Eval.ifElse';
    static $help = `
For each element evaluates the condition pipeline.
If condition is \true\`, evaluates the positive branch pipeline, otherwise evaluates the negative branch.

Condition pipeline should return a single element for each element in input set.
An error is thrown if condition value is not a boolean.

### Use For

- applying different pipelines to elements based on a condition
- advanced scripting
`;

    @params.Pipeline({ label: 'Condition' })
    pipelineCondition!: Pipeline;
    @params.Pipeline({ label: 'Positive Branch' })
    pipelinePositive!: Pipeline;
    @params.Pipeline({ label: 'Negative Branch' })
    pipelineNegative!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipelineCondition = this.pipelineCondition;
        const pipelinePositive = this.pipelinePositive;
        const pipelineNegative = this.pipelineNegative;
        const results = [];
        for (const el of inputSet) {
            const conditionEl = await pipelineCondition.selectOne([el], ctx);
            const condition = conditionEl.value;
            util.checkType(condition, 'boolean', 'Condition');
            const outcomes = condition
                ? await pipelinePositive.selectAll([el], ctx)
                : await pipelineNegative.selectAll([el], ctx);
            results.push(...outcomes);
        }
        return results;
    }
}
