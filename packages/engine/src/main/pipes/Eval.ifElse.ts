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
