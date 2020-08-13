import { Pipe } from '../pipe';
import { params } from '../model';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomMatchesSelector extends Pipe {
    static $type = 'DOM.matches';
    static $help = `
Returns \`true\` if element matches specifed selector.
`;

    @params.Selector()
    selector: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return await this.map(inputSet, async el => {
            const val = await el.remote.matches(this.selector);
            return el.clone(val);
        });
    }
}
