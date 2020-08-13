import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListSkipWhile extends Pipe {
    static $type = 'List.skipWhile';
    static $help = `
Starting in specified direction, discards input elements whilst inner pipeline produces \`true\`.

Unlike Filter, which discards all non-matching elements, this pipe
only discards a continuous sequence of elements either at the start or at the end.

### See Also

- Take While: for opposite effect.
`;

    @params.Pipeline({ label: 'Condition' })
    pipeline!: Pipeline;

    @params.Enum({
        enum: [
            { label: 'left to right', value: 'ltr' },
            { label: 'right to left', value: 'rtl' },
        ],
    })
    direction: string = 'ltr';

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        const direction = this.direction;
        const rtl = direction === 'rtl';
        util.assertScript(pipeline.length, 'No pipes defined');
        const results = rtl ? inputSet.slice().reverse() : inputSet;
        while (results.length > 0) {
            const el = results[0];
            const res = await pipeline.selectOne([el], ctx);
            util.checkType(res.value, 'boolean');
            if (res.value) {
                results.shift();
            } else {
                break;
            }
        }
        return rtl ? results.reverse() : results;
    }
}
