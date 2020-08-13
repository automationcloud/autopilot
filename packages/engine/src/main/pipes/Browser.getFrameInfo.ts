import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomFrameInfo extends Pipe {
    static $type = 'Browser.getFrameInfo';
    static $help = `
Returns information about current frame and its loading state.

### Use For

- implementing assertions on frame loading, readiness or failure to load
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return await this.map(inputSet, async el => {
            const frame = el.remote.frame;
            const info = frame.collectInfo();
            return el.clone(info);
        });
    }
}
