import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ContainsPipe extends Pipe {
    static $type = 'Value.contains';
    static $help = `
Evaluates two operands by passing each element of input set through two different pipelines,
then returns a boolean indicating whether operand A conceptually contains operand B.

The result depends on the data type of operand A and is evaluated according to following rules:

- if operand A is an object, then the result is \`true\` only if operand B is also an object,
  and each value of object B is equal to the corresponding value of object A
- if operand B is an array, then the result is \`true\` only is operand B is also an array,
  and each item of array B exists in array A
- all other data types are coerced to strings, and \`true\` is returned if B is a substring of A

Inner pipelines should return a single element for each element in input set.

### Use For

- general purpose containment tests which work across multiple data types, specifically:
  - is string a substring of another string
  - is object a sub-object of another object
  - is array a sub-array of another array

### See Also

- Contains Text: for simpler alternative when second operand is a string constant
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
            const val = util.anyContains(a.value, b.value);
            return el.clone(val);
        });
    }
}
