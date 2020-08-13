import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomInnerHtml extends Pipe {
    static $type = 'DOM.getInnerHtml';
    static $help = `
Returns \`innerHTML\` property of an element.

### Use For

- extracting HTML content

### See Also

- String.sanitizeHtml in case the extracted HTML is to be presented to user in some way
  (e.g. via output)
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return await this.map(inputSet, async el => {
            const innerHtml = await el.evaluateJson(el => el.innerHTML);
            return el.clone(util.normalizeString(innerHtml));
        });
    }
}
