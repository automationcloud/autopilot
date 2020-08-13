import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

// TODO consider replacing with Math pipe, with binary operations like +, -, *, /, %, etc added

export class ValueNumericCompare extends Pipe {
    static $type = 'Number.compare';
    static $help = `
Evaluates two operands by passing each element of input set through two different pipelines,
then returns the boolean result of numeric comparison of these two operands using specified operator.

Inner pipelines should return a single element for each element in input set.
An error is thrown if the result is not a number.

### Use For

- general purpose numerical comparison (e.g. for matching the number of registered luggage against Job Input)
`;

    @params.Pipeline({ label: 'Operand A' })
    pipelineA!: Pipeline;
    @params.Pipeline({ label: 'Operand B' })
    pipelineB!: Pipeline;
    @params.Enum({
        enum: [
            'equals',
            'not equals',
            'greater than',
            'greater than or equals to',
            'less than',
            'less than or equals to',
        ],
    })
    operator: string = 'equals';

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipelineA = this.pipelineA;
        const pipelineB = this.pipelineB;
        const operator = this.operator;
        return await this.map(inputSet, async el => {
            const a = await pipelineA.selectOne([el], ctx);
            const b = await pipelineB.selectOne([el], ctx);
            util.checkType(a.value, 'number');
            util.checkType(b.value, 'number');
            const val = this.compare(a.value, b.value, operator);
            return el.clone(val);
        });
    }

    compare(a: number, b: number, operator: string): boolean {
        switch (operator) {
            case 'equals':
                return a === b;
            case 'not equals':
                return a !== b;
            case 'greater than':
                return a > b;
            case 'less than':
                return a < b;
            case 'greater than or equals to':
                return a >= b;
            case 'less than or equals to':
                return a <= b;
            default:
                throw util.scriptError('Unknown operator: ' + this.operator);
        }
    }
}
