import { Action } from '../action';
import { Pipeline } from '../pipeline';
import { params } from '../model';

export class HoverAction extends Action {
    static $type = 'Page.hover';
    static $icon = 'fas fa-hand-pointer';
    static $help = `
Same as Click, but does not send emulated Mouse Down and Mouse Up events.
Instead, the element is checked for visibility, and the mouse is positioned over it.

### Parameters

See Click.

### Use For

- hovering over elements without clicking them (e.g. to reveal old style dropdown menus which work on mouse hover)
`;

    @params.Pipeline()
    pipeline!: Pipeline;
    @params.Boolean()
    optional: boolean = false;
    @params.Boolean()
    altKey: boolean = false;
    @params.Boolean()
    ctrlKey: boolean = false;
    @params.Boolean()
    metaKey: boolean = false;
    @params.Boolean()
    shiftKey: boolean = false;

    async exec() {
        const ctx = this.createCtx();
        await this.retry(async () => {
            const el = await this.selectSingle(this.pipeline, this.optional, ctx);
            if (el) {
                await el.remote.getStablePoint();
                await el.tooltip('hover');
                await ctx.takeDebugScreenshot('hover');
                await el.remote.hover({
                    waitForStable: false, // b/c we already did it above
                    altKey: this.altKey,
                    ctrlKey: this.ctrlKey,
                    metaKey: this.metaKey,
                    shiftKey: this.shiftKey,
                });
            } else {
                this.$runtime.bypassed = true;
            }
        });
    }
}
