import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueFormatUrl extends Pipe {
    static $type = 'Data.formatUrl';
    static $help = `
Takes input object with URL components and returns a URL string.

URL components may include following keys:

- protocol (e.g. \`http:\`, \`https:\`)
- host (e.g. \`example.com\`, \`example.com:3123\`)
- hostname (e.g. \`example.com\`)
- pathname (e.g. \`/path/to/resource\`)
- query: an object with query parameters (e.g. \`{ hello: 'world' }\`)
- hash (e.g. \`#link\`)

Query parameters are automatically URI-encoded.

An error is thrown if input value is not an object, or if there's not enough information to construct a URL.

### Use For

- composing URLs for network requests and other applications
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return this.map(inputSet, el => {
            util.checkType(el.value, 'object');
            const newData = util.formatUrl(el.value);
            return el.clone(newData);
        });
    }
}
