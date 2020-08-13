import * as util from '../util';
import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomPreviousSibling extends Pipe {
    static $type = 'DOM.previousSibling';
    static $help = `
Returns n-th previous DOM sibling of an element.
An error is thrown if no previous sibling exists.
`;

    @params.Number({
        min: 1,
        max: 999,
        help: 'Specifies sibling offset, 1 being previous sibling, 2 being previous before previous and so on.',
    })
    count: number = 1;
    @params.Boolean({
        help: 'Produce 0 elements instead of throwing an error when no sibling exists.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const count = this.count;
        const optional = this.optional;

        util.assertScript(count >= 1, 'Count should be a positive integer');
        return await this.map(inputSet, async el => {
            let newEl = el;
            for (let i = 0; i < count; i += 1) {
                const nextEl = await newEl.previousSibling(optional);
                if (!nextEl) {
                    return null;
                }
                newEl = nextEl;
            }
            return newEl;
        });
    }
}
