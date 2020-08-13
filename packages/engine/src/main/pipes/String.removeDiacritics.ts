import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import diacritics from 'diacritics';

export class RemoveDiacriticsPipe extends Pipe {
    static $type = 'String.removeDiacritics';
    static $help = `
Replaces accented characters with their ASCII equivalent,
e.g. \`å\` becomes \`a\`, \`œ\` becomes \`oe\` and so on.

### Use For

- working with international text, especially in matching
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return this.map(inputSet, el => {
            util.checkType(el.value, 'string');
            const result = diacritics.remove(el.value);
            return el.clone(result);
        });
    }
}
