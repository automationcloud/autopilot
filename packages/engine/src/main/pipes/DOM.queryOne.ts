import { Pipe } from '../pipe';
import { params } from '../model';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomQueryOne extends Pipe {
    static $type = 'DOM.queryOne';
    static $help = `
Returns Element node found by specified selector.
An error is thrown if multiple elements are found within each element.

### Use For

- selecting a unique Element on the page
- for each element in a set, selecting a unique sub-element

### See Also

- DOM.queryAll: for the equivalent pipe which allows multiple elements to be found by selector
`;

    @params.Selector()
    selector: string = '';
    @params.Boolean({
        help: 'Produce 0 elements instead of throwing an error when no elements are found.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const selector = this.selector;
        const optional = this.optional;

        return await this.map(inputSet, el => el.queryOne(selector, optional));
    }
}
