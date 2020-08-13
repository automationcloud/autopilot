import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class StringJoin extends Pipe {
    static $type = 'String.join';
    static $help = `
Returns a single element with string value, produced by concatenating all values of input elements
with specified separator.

An error is thrown if input set contains object or array values, which are not supported.
`;

    @params.String()
    separator: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const separator = this.separator;

        const array = inputSet.map(el => el.value);
        for (const item of array) {
            util.checkType(item, ['string', 'number', 'boolean']);
        }
        const el = await this.createDocument(array.join(separator));
        return [el];
    }
}
