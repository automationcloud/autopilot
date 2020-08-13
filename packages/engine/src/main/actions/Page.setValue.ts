import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { params } from '../model';

export class SetValueAction extends Action {
    static $type = 'Page.setValue';
    static $icon = 'fas fa-terminal';
    static $help = `
Similar to Page.input, but modifies DOM value of output element directly,
by assigning to \`value\` DOM property.

### See Also

- Page.input: for addition details
`;

    @params.Pipeline()
    pipeline!: Pipeline;
    @params.Boolean()
    optional: boolean = false;

    async exec() {
        const ctx = this.createCtx();
        await this.retry(async () => {
            const el = await this.selectSingle(this.pipeline, this.optional, ctx);
            if (el) {
                await el.assertElement('Set Value only works on HTML elements');
                util.checkType(el.value, ['string', 'number']);
                const value = String(el.value);
                await el.tooltip('setValue');
                await el.remote.evaluate((el, value) => {
                    const config = {
                        bubbles: true,
                        cancelable: false,
                        view: window,
                    };
                    if (el.value !== value) {
                        el.value = value;
                        // https://www.w3.org/TR/uievents/#input
                        el.dispatchEvent(new Event('input', config));
                        // https://developer.mozilla.org/en-US/docs/Web/Events/change
                        el.dispatchEvent(new Event('change', config));
                    }
                }, value);
                await ctx.takeDebugScreenshot('setValue');
            } else {
                this.$runtime.bypassed = true;
            }
        });
    }
}
