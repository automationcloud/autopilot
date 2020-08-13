import { Pipe } from '../pipe';
import { params } from '../model';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomClosest extends Pipe {
    static $type = 'DOM.closest';
    static $help = `
Returns the closest ancestor of an element matching specified selector.
Throws an error if no such element is found.
`;

    @params.Selector()
    selector: string = '';
    @params.Boolean({
        help: 'Omit an element if no matching ancestor is found.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const selector = this.selector;
        const optional = this.optional;

        return await this.map(inputSet, el => el.closest(selector, optional));
    }
}
