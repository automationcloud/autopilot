import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import { Pipeline } from '../pipeline';
import * as util from '../util';

export class GetInputDynamicPipe extends Pipe {
    static $type = 'Value.getDynamicInput';
    static $help = `
Returns the value of specified Job Input.
The input key is evaluated using nested pipeline.
`;

    @params.Pipeline({
        label: 'Key',
        help: 'Pipeline for evaluating key, executed per each element.',
    })
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        return await this.map(inputSet, async el => {
            const res = await pipeline.selectOne([el], ctx);
            util.checkType(res.value, 'string');
            const data = await this.$script.requestInput(res.value);
            return el.clone(data);
        });
    }
}
