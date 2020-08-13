import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValuePeekInput extends Pipe {
    static $type = 'Value.peekInput';
    static $help = `
Gets the input without requesting it, i.e. doesn't set job.state = 'awaitingInput' if the input not exists yet.

### Use For

- checking if the Job Input is supplied by the time of playback
`;

    @params.String({ source: 'inputs' })
    inputKey: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const data = await this.$script.peekInput(this.inputKey);
        return this.map(inputSet, el => {
            return el.clone(data);
        });
    }
}
