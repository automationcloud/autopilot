import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomIframe extends Pipe {
    static $type = 'DOM.iframe';
    static $help = `
Returns DOM contentDocument node of the IFRAME element.
An error is thrown if applied to non-frame elements.

### Use For

- accessing the contents of iframes
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return await this.map(inputSet, async el => {
            util.assertPlayback(el.remote.isFrame(), `Cannot get content document on ${el.description}`);
            return await el.contentDocument();
        });
    }
}
