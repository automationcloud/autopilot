import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueParseJson extends Pipe {
    static $type = 'String.parseJson';
    static $help = `
Parses JSON from input value string.

An error is thrown if input value is not a valid JSON string.

### Use For

- advanced scripting (e.g. parse raw network response, or parse JSON from webpage)
`;

    @params.Boolean()
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const optional = this.optional;

        return this.map(inputSet, el => {
            try {
                const json = JSON.parse(el.value);
                return el.clone(json);
            } catch (err) {
                util.assertPlayback(optional, 'JSON parsing failed');
                return null;
            }
        });
    }
}
