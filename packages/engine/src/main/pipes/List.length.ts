import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListLength extends Pipe {
    static $type = 'List.length';
    static $help = `
Returns a single element whose value is a number of elements in the input set.

### Use For

- accessing the count of input elements (e.g. to output the number of available options on the website)
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const el = await this.createDocument(inputSet.length);
        return [el];
    }
}
