import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomGetDocument extends Pipe {
    static $type = 'DOM.document';
    static $help = `
Replace the DOM node of each input element with top #document node.

### Use For

- accessing elements outside of current DOM scope (e.g. inside \`each\` loop)
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const document = await this.$page.document();
        return await this.map(inputSet, async el => {
            return new Element(document, el.value);
        });
    }
}
