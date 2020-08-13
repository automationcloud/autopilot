import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListRepeat extends Pipe {
    static $type = 'List.repeat';
    static $help = `
Creates specified number of copies of each input element.
`;

    @params.Pipeline({
        label: 'Count',
    })
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        const results = [];
        for (const el of inputSet) {
            const result = await pipeline.selectOne([el], ctx);
            util.checkType(result.value, 'number');
            for (let i = 0; i < result.value; i += 1) {
                results.push(el);
            }
        }
        return results;
    }
}
