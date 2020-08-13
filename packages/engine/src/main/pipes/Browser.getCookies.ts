import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class GetCookiesPipe extends Pipe {
    static $type = 'Browser.getCookies';
    static $help = `
Obtains browser cookies and returns them as element values.
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const cookies = await this.$page.getAllCookies();
        const results = [];
        for (const el of inputSet) {
            for (const cookie of cookies) {
                results.push(el.clone(cookie));
            }
        }
        return results;
    }
}
