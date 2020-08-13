import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomIsVisible extends Pipe {
    static $type = 'DOM.isVisible';
    static $help = `
Returns true if Element is visible, that is:

- its content box has both width and height greater than zero
- its CSS styles don't include visibility: hidden

### Use For

- filtering invisible elements for further manipulations
- asserting element visibility in expectations
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return await this.map(inputSet, async el => {
            return el.clone(await el.remote.isVisible());
        });
    }
}
