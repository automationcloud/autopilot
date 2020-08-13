import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueSanitizeHtml extends Pipe {
    static $type = 'String.sanitizeHtml';
    static $help = `
Takes input string containing HTML markup and removes unsafe tags
(e.g. \`<script>\`) and attributes (e.g. \`onclick\`).

An error is thrown if input value is not a string.

### Use For

- pre-processing
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return this.map(inputSet, el => {
            util.checkType(el.value, 'string');
            const cleanHtml = util.sanitizeHtml(el.value);
            return el.clone(cleanHtml);
        });
    }
}
