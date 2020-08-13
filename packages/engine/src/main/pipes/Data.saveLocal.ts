import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DataLocalSave extends Pipe {
    static $type = 'Data.saveLocal';
    static $deprecated = 'Using this pipe is highly discouraged. The pipe is scheduled for removal.';
    static $help = `
Saves input set, so that it could be later restored with Local Restore.

### Use For

- Do not. This pipe allows creating very non-intuitive data flows, which are nearly impossible to reason about.
- Consider using more conventional tools for solving the problem, or create a custom pipe if none work.
`;

    @params.String({ source: 'locals' })
    key: string = '';

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        ctx.setLocal(this.key, inputSet);
        return inputSet;
    }
}
