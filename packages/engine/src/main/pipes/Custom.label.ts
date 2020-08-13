import { params } from '../model';
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class CustomLabel extends Pipe {
    static $type = 'Custom.label';
    static $help = `
This pipe is a simple group with a customized label.
The input set is passed to the inner pipeline and the output set of the inner pipeline
becomes the output set of this pipe.

### Use For

- structuring complex pipelines
`;

    @params.String({
        help: 'String label which will appear in user interface, has no effect on produced results.',
    })
    label: string = '';

    @params.Pipeline()
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        return await pipeline.selectAll(inputSet, ctx);
    }
}
