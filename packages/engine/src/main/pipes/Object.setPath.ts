import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import jsonPointer from 'jsonpointer';

export class ValueSetPath extends Pipe {
    static $type = 'Object.setPath';
    static $help = `
Evaluates the inner pipeline for each element and assigns the resulting value
to the input object at specified path.
The inner pipeline must resolve to a single element.
An error is thrown if input value is not an object or an array.

### See Also

- Move Path: for moving values to different keys without modification
- Transform Path: for modifying the value at specified path without moving it

### Use For

- building an object using values from various sources
- modifying or extending existing objects
`;

    @params.String({
        source: 'dataPaths',
        help: 'JSON pointer into input object where the new value is to be written.',
    })
    path: string = '';

    @params.Enum({
        enum: ['bypass', 'discard', 'delete', 'set null'],
        help: `
Specifies what action to take if the pipeline produces null or undefined:

- bypass: do not modify existing value
- discard: remove the element from output set
- set null: assign \`null\` at specified path
- delete: delete the object key at specified path
`,
    })
    onNull: string = 'bypass';

    @params.Pipeline({
        label: 'Value',
        help: 'Pipeline for evaluating new value, executed per each element.',
    })
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const path = this.path;
        util.assertScript(this.pipeline.length, 'No pipes defined');
        return await this.map(inputSet, async el => {
            util.checkType(el.value, 'object');
            const result = await this.pipeline.selectOneOrNull([el], ctx);
            const val = result ? result.value : null;
            const newData = util.deepClone(el.value);
            if (val == null) {
                switch (this.onNull) {
                    case 'skip':
                    case 'discard':
                        return null;
                    case 'bypass':
                        return el;
                    case 'delete':
                        jsonPointer.set(newData, path, undefined);
                        return el.clone(newData);
                    case 'set null':
                        jsonPointer.set(newData, path, null);
                        return el.clone(newData);
                }
            }
            jsonPointer.set(newData, path, val);
            return el.clone(newData);
        });
    }
}
