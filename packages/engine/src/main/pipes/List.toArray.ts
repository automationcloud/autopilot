import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListToArray extends Pipe {
    static $type = 'List.toArray';
    static $help = `
Returns a single element whose value is an array containing all values of the input set.
The DOM node of the result is set to top #document.

### Use For

- transforming elements into arrays (e.g. to use as part of Job Output)

### See Also

- Unfold Array: for reverse functionality
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const array = inputSet.map(el => el.value);
        const el = await this.createDocument(array);
        return [el];
    }
}
