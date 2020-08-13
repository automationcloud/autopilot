import { Pipe } from '../pipe';
import { params } from '../model';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomQueryXpathOne extends Pipe {
    static $type = 'DOM.queryXPathOne';
    static $help = `
Returns Element node found by specified Xpath expression.
An error is thrown if multiple elements are found within each element.

### Use For

- selecting a unique Element on the page
- for each element in a set, selecting a unique sub-element

### See Also

- DOM.queryXpathAll: for the equivalent pipe which allows multiple elements to be found by Xpath expression
`;

    @params.String()
    expression: string = '';
    @params.Boolean({
        help: 'Produce 0 elements instead of throwing an error when no elements are found.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const expression = this.expression;
        const optional = this.optional;

        return await this.map(inputSet, el => el.queryXPathOne(expression, optional));
    }
}
