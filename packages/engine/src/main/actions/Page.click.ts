// Copyright 2020 Ubio Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Action } from '../action';
import { Pipeline } from '../pipeline';
import { params } from '../model';

export class ClickAction extends Action {
    static $type = 'Page.click';
    static $icon = 'fas fa-mouse-pointer';
    static $help = `
Clicks the element on the page.

The pipeline should return a single DOM element where the click will be performed.

The value of the element is ignored. In practice, values are useful to find a particular element out of collection.
For example, given a list of flights a pipeline can be contructed to find a particular flight row
and click an element inside of it.

The element where the click is performed should be visible (have non-zero visual area) and reachable by coordinates.
If the element is hidden under some other overlaying elements, the overlays will be temporary removed before clicking,
and then restored after clicking.

Important: the effect of the click (e.g. a form submission) cannot be guaranteed,
thus it is a good practice to place an [Expect](#expect) next to Click to capture the observable effect on the webpage
(e.g. a confirmation message).

The exact algorithm is as follows:

- the scope element is resolved from parent (#document by default)
- the pipeline is executed with scope element as its input set, expecting a single element in the output set
- the element is scrolled into view
- the screenshot is taken (if executed debug screenshots are enabled for the job)
- if the element is \`<option>\`:
  - the \`<select>\` element is checked for visibility and reachability
  - the mouse is positioned over \`<select>\`, producing necessary mouse events
  - the value of the \`<select>\` is set to the index of the \`<option>\` element via client-side JavaScript
  - the synthetic \`input\` and \`change\` events are fired on \`<select>\`
- if the element is not \`<option>\`:
  - the element is checked for visbility, visual dimensions and reachability
  - overlays obscuring the element are temporarily removed
  - the mouse is positioned over the element's center (based on element's bounds), producing necessary mouse events
  - the emulated click is sent to the coordnates of the element's center
  - if navigation has not yet started, the overlaying elements are restored

### Parameters

- optional: if checked, the pipeline is allowed to return 0 elements in which case the action is bypassed,
  otherwise an error is thrown if pipeline returns 0 elements
- wait for stable box: after element is initially scrolled into view the action will wait
  for element's position to remain constant for a few frames;
  this is to prevent accidentally clicking at wrong location if the element is currently involved in an animation
  (e.g. smooth scrolling, carousels, etc.)
- alt: if checked, the emulated click will be sent with Alt key pressed
- ctrl: if checked, the emulated click will be sent with Ctrl key pressed
- shift: if checked, the emulated click will be sent with Shift key pressed
- Meta: if checked, the emulated click will be sent with Meta key pressed

### Use For

- clicking buttons
- selecting options
- submitting forms
`;

    @params.Pipeline()
    pipeline!: Pipeline;
    @params.Boolean()
    optional: boolean = false;

    async exec() {
        const ctx = this.createCtx();
        await this.retry(async () => {
            const el = await this.selectSingle(this.pipeline, this.optional, ctx);
            if (!el) {
                this.$runtime.bypassed = true;
                return;
            }
            if (el.remote.isOption()) {
                await el.remote.scrollIntoViewIfNeeded();
                await el.tooltip('selectOption');
                await ctx.takeDebugScreenshot('selectOption');
                await el.remote.selectOption();
                return;
            }
            await el.remote.getStablePoint();
            await el.tooltip('click');
            await ctx.takeDebugScreenshot('click');
            await el.remote.click({
                waitForStable: false, // b/c we already did it above
            });
        });
    }
}
