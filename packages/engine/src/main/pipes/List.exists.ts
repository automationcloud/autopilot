import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListExists extends Pipe {
    static $type = 'List.exists';
    static $help = `
Returns a single element whose value is \`true\` if the input set contains one or more elements,
and \`false\` otherwise. The DOM node of the result is set to top #document.

### Use For

- checking if collection has elements (e.g. as part of filters or matchers)
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const value = inputSet.length > 0;
        const el = await this.createDocument(value);
        return [el];
    }
}
