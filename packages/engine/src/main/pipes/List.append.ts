import { params } from '../model';
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListAppend extends Pipe {
    static $type = 'List.append';
    static $help = `
Concatenates the input set with the output set of inner pipeline.
The input set comes before the inner pipeline's results.

The inner pipeline is executed only once (as opposed to other pipelines
which are executed per each element in input set), with #document element as its input set.
A typical usage is to have a Use Definition pipe inside of it,
so that multiple definitions can be concatenated together.

### Use For

- concatenating elements from multiple definitions or other sources

### See Also

- List.prepend: for similar functionality with different order of elements
`;

    @params.Pipeline({ label: 'Appended set' })
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        const scope = await this.createDocument();
        const otherSet = await pipeline.selectAll([scope], ctx);
        return inputSet.concat(otherSet);
    }
}
