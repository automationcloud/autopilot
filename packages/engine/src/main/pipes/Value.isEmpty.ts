import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueIsEmpty extends Pipe {
    static $type = 'Value.isEmpty';
    static $help = `
Returns \`true\` if input value is either an empty string, an empty array or \`null\`.
The string is considered empty if it contains nothing but whitespace.

### Use For

- checking for null values, especially if previous pipe is optional
  (that is, allowed to return \`null\` values instead of throwing errors, which is a common pipe convention)
- checking for empty strings
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return this.map(inputSet, el => {
            const isEmpty = util.normalizeString(el.value) === '';
            return el.clone(isEmpty);
        });
    }
}
