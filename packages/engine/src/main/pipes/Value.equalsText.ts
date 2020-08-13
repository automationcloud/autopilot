import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueEqualsText extends Pipe {
    static $type = 'Value.equalsText';
    static $help = `
Returns \`true\` if input value equals to specified string constant.
Non-string values are coerced to strings and are tested according to rules specified in Equals.

This is simpler equivalent to Equals pipe, where one of the operands is constant.

### Use For

- creating matchers with text equality tests
- general purpose equality tests where one of the operands is constant
`;

    @params.String({
        help: 'String constant to test input value against.',
    })
    text: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const text = this.text;

        return this.map(inputSet, el => {
            return el.clone(util.strEquals(el.value, text));
        });
    }
}
