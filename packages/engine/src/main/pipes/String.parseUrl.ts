import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueParseUrl extends Pipe {
    static $type = 'String.parseUrl';
    static $help = `
Parses input string using embedded URL parser, and returns the result.

The result is an object containing following properties:

- protocol (e.g. \`http:\`, \`https:\`)
- host (e.g. \`example.com\`, \`example.com:3123\`)
- hostname (e.g. \`example.com\`)
- pathname (e.g. \`/path/to/resource\`)
- query: an object with query parameters (e.g. \`{ hello: 'world' }\`)
- hash (e.g. \`#link\`)
`;

    @params.Boolean({
        help: 'Return `null` instead of throwing an error, if URL cannot be parsed.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const optional = this.optional;

        return this.map(inputSet, el => {
            util.checkType(el.value, 'string');
            const parsed = util.parseUrl(el.value);
            util.assertPlayback(!!parsed || optional, 'URL parsing failed');
            return el.clone(parsed);
        });
    }
}
