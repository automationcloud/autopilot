import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListSkip extends Pipe {
    static $type = 'List.skip';
    static $help = `
Discards specified number of elements and returns everything else.

### Use For

- excluding placeholder elements from sets, specifically for \`<option>\`
  elements whose first element is typically a placeholder and does not represent an actual option
- excluding other kinds of elements like table headers or column headers
`;

    @params.Number({ min: 0 })
    count: number = 1;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const count = this.count;
        return inputSet.slice(count);
    }
}
