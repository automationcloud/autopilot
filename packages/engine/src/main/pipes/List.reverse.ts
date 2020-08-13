import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListReverse extends Pipe {
    static $type = 'List.reverse';
    static $help = `
Returns the elements from the input set in a reversed order.

### Use For

- advanced scripting
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return inputSet.slice().reverse();
    }
}
