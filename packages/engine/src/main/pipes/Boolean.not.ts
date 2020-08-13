import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class BooleanNot extends Pipe {
    static $type = 'Boolean.not';
    static $help = `
Returns a logical inverse of input boolean value. An error is thrown if input value is not a boolean.

### Use For

- inverting the results of other boolean-producing pipes
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return this.map(inputSet, el => {
            util.checkType(el.value, 'boolean');
            return el.clone(!el.value);
        });
    }
}
