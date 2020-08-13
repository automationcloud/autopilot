import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListLimit extends Pipe {
    static $type = 'List.limit';
    static $help = `
Returns specified number of first elements in input set and discards everything else.
A typical usage scenario is to have limit \`1\` which ensures that the output set only contains a single element.

### Use For

- restricting elements to a single element
  (e.g. for \`click\` actions, especially when filtering yields more than one element and
  they are functionally equivalent)
- returning sampled data of fixed length
`;

    @params.Number({
        min: 0,
        help: 'number of elements to keep',
    })
    count: number = 1;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const count = this.count;

        return inputSet.slice(0, count);
    }
}
