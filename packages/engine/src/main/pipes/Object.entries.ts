import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import * as util from '../util';

export class ObjectEntries extends Pipe {
    static $type = 'Object.entries';
    static $help = `
Converts each object into \`[key, value]\` pairs for each property.

Throws an error if element value is not an object.
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return this.map(inputSet, el => {
            const results: Element[] = [];
            const obj = el.value;
            util.checkType(obj, 'object');
            for (const entry of Object.entries(obj)) {
                results.push(el.clone(entry));
            }
            return results;
        });
    }
}
