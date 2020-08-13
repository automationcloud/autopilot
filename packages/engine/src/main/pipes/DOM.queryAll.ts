import { Pipe } from '../pipe';
import { params } from '../model';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomQueryAll extends Pipe {
    static $type = 'DOM.queryAll';
    static $help = `
Returns all Element nodes found by specified selector.

### Use For

- returning a group of elements (e.g. prices) for further manipulation (e.g. text parsing)

### See Also

- DOM.queryOne: for the equivalent pipe which returns a single node
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

        return await this.map(inputSet, el => el.queryAll(selector, optional));
    }
}
