import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueContainsText extends Pipe {
    static $type = 'Value.containsText';
    static $help = `
Returns \`true\` if input value contains specified string constant.
Non-string values are coerced to strings and are tested according to rules specified in Contains.

### Parameters

- text: string constant to test the input value against

### Use For

- creating matchers where matching text partially is preferred
- general purpose string containment tests against string constant
`;

    @params.String()
    text: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const text = this.text;

        return this.map(inputSet, el => {
            return el.clone(util.strContains(el.value, text));
        });
    }
}
