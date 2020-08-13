import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

import jsonPointer from 'jsonpointer';

export class ValueGetPath extends Pipe {
    static $type = 'Object.getPath';
    static $help = `
Returns the value at specified path.
An error is thrown if datum resolves to undefined.
An error is thrown if input value is not object/array.

### Use For

- accessing nested data of objects and arrays (e.g. Job Inputs)
`;

    @params.String({
        source: 'dataPaths',
        help: 'JSON pointer into input value.',
    })
    path: string = '';

    @params.Boolean({
        help: `Return \`null\` instead of throwing error when datum resolves to undefined.`,
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const path = this.path;
        const optional = this.optional;

        return this.map(inputSet, el => {
            util.checkType(el.value, ['object', 'array']);
            let data = jsonPointer.get(el.value, path);
            if (data === undefined) {
                data = null;
            }
            util.assertPlayback(data != null || optional, 'Data at specified path does not exist');
            return el.clone(data);
        });
    }
}
