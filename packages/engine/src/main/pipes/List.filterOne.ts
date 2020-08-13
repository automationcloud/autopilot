import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListFilterOne extends Pipe {
    static $type = 'List.filterOne';
    static $help = `
Same as \`List.filter\`, but expects exactly one element.
`;

    @params.Pipeline({
        label: 'Condition',
    })
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        util.assertScript(pipeline.length, 'No pipes defined');
        const results = [];
        for (const el of inputSet) {
            const result = await pipeline.selectOne([el], ctx);
            util.checkType(result.value, 'boolean');
            if (result.value) {
                results.push(el);
            }
        }
        if (results.length !== 1) {
            throw util.playbackError(`Expected a single element, found ${results.length}`);
        }
        return results;
    }
}
