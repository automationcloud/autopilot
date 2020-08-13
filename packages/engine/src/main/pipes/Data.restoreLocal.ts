import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DataLocalRestore extends Pipe {
    static $type = 'Data.restoreLocal';
    static $deprecated = 'Using this pipe is highly discouraged. The pipe is scheduled for removal.';
    static $help = `
Restores a set saved with Local Save pipe.
Input set is discared.

### Use For

- Do not. This pipe allows creating very non-intuitive data flows, which are hard to reason about.
`;

    @params.String({ source: 'locals' })
    key: string = '';

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        return ctx.getLocal(this.key);
    }
}
