import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class BooleanAnd extends Pipe {
    static $type = 'Boolean.and';
    static $help = `
Evaluates two operands by passing each element of input set through two different pipelines,
then returns \`true\` if both operands are \`true\`, and \`false\` otherwise.

Inner pipelines should return a single element for each element in input set.
An error is thrown if the result is not a boolean.

### Use For

- combining multiple booleans using logical AND (conjunction)
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
            const val = a.value && b.value;
            return el.clone(val);
        });
    }
}
