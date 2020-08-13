import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { params } from '../model';

export class CookiesAction extends Action {
    static $type = 'Page.setCookies';
    static $icon = 'fas fa-cookie-bite';
    static $help = `
Sets cookies by reading an array from specified Job Input.

Cookie array should consist of objects with following keys:

- \`name\`
- \`value\`
- \`url\`
- \`domain\`
- \`path\`
- \`secure\`
- \`httpOnly\`
- \`sameWebsite\`
- \`expires\`

### Use For

- scripting flows which require cookies to be set prior to navigation
`;

    @params.Pipeline()
    pipeline!: Pipeline;
    @params.Boolean()
    optional: boolean = false;

    async exec() {
        await this.retry(async () => {
            const el = await this.selectSingle(this.pipeline, this.optional);
            if (el) {
                util.checkType(el.value, ['object', 'array']);
                const array = Array.isArray(el.value) ? el.value : [el.value];
                for (const cookie of array) {
                    await this.$page.send('Network.setCookie', cookie);
                }
            } else {
                this.$runtime.bypassed = true;
            }
        });
    }
}
