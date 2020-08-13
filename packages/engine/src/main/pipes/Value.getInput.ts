import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueGetInput extends Pipe {
    static $type = 'Value.getInput';
    static $help = `
Returns the value of specified Job Input.

### Use For

- accessing Job Inputs for further manipulation (e.g. filter by Job Input value)
`;

    @params.String({ source: 'inputs' })
    inputKey: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const inputKey = this.inputKey;
        const data = await this.$script.requestInput(inputKey);
        return this.map(inputSet, el => {
            return el.clone(data);
        });
    }
}
