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
import * as util from '../util';
import { Element } from '../element';
import { params } from '../model';

export class InputAction extends Action {
    static $type = 'Page.input';
    static $icon = 'fas fa-i-cursor';
    static $help = `
Types text into DOM element.

The pipeline should resolve to a single element.
The value of the element must be a string — it will be sent to the DOM node as a series of keyboard events.

In order to handle keyboard events properly the element must receive focus.
There are multiple ways of setting the focus, the most reliable way which works in most cases is
to simply click on the element. For simplicity, this action includes a Use Click parameter
which does everything the Click does prior to sending the keyboard events.

However, there are edge cases when performing a click is undesirable (e.g. click opens a popup).
To address these cases there are few more parameters listed below which allow alternative focusing techniques.
Those are to be used at one's own discretion, as they are tightly coupled to website's internal implementation
details and are susceptible to even slightest changes.

The exact algorithm is as follows:

- the scope element is resolved from parent (#document by default)
- the pipeline is executed with scope element as its input set,
  expecting a single element in the output set and a string or number value
- the element is scrolled into view
- if Use Click is enabled, a subset of Click algorithm is performed on the element
- if Clear input is enabled, the entire text is selected and Backspace keystroke is sent to the webpage,
  causing the input to become clear
- a series of keystrokes is sent to the element as emulated keyboard events
- if Press Enter is enabled, an Enter keystroke is sent to the webpage
- if Use Blur is enabled, a synthetic \`blur\` event is triggered on the element via client-side JavaScript
- the screenshot is taken (if executed debug screenshots are enabled for the job)

### Parameters

- optional: if checked, the pipeline is allowed to return 0 elements in which case the action is bypassed,
  otherwise an error is thrown if pipeline returns 0 elements
- wait for stable box: after element is initially scrolled into view the action will wait for element's position
  to remain constant for a few frames; this is to prevent accidentally clicking at wrong location
  if the element is currently involved in an animation (e.g. smooth scrolling, carousels, etc.)
- check visibility: if unchecked, visibility check is bypassed (deprecated, incompatible with Use Click)
- use click: if checked, Click is used to focus the element
- use ticks: if checked, an small artificial delay is inserted between keystrokes; otherwise all keystrokes
  are sent simultaneously
- clear input: if checked, the text of the element is selected and cleared prior to typing text
- press Enter: if checked, an Enter keystroke is sent to the webpage after typing text
- use blur: if checked, a synthetic \`blur\` event is triggered on the element after typing

### Use For

- typing text into text input fields
`;

    @params.Pipeline()
    pipeline!: Pipeline;
    @params.Boolean()
    optional: boolean = false;
    @params.Boolean()
    checkAndRetry: boolean = true;
    @params.Boolean()
    useClick: boolean = true;
    @params.Boolean()
    useClear: boolean = true;
    @params.Boolean()
    useFocus: boolean = true;
    @params.Boolean()
    useBlur: boolean = true;
    @params.Boolean()
    useEnter: boolean = false;
    @params.Number({
        min: 0,
        max: 600000
    })
    delay: number = 0;

    async exec() {
        const ctx = this.createCtx();
        await this.retry(async () => {
            const el = await this.selectSingle(this.pipeline, this.optional, ctx);
            if (el) {
                await el.assertElement('Input only works on HTML elements');
                util.checkType(el.value, ['string', 'number']);
                await this.attemptInput(el, String(el.value));
                await ctx.takeDebugScreenshot('input');
            } else {
                this.$runtime.bypassed = true;
            }
        });
    }

    async attemptInput(
        el: Element,
        value: string,
        attempt: number = 5
    ) {
        if (attempt <= 0) {
            return;
        }
        await el.remote.getStablePoint();
        await el.tooltip('input');
        await el.remote.typeText(value, {
            click: this.useClick,
            clear: this.useClear,
            focus: this.useFocus,
            blur: this.useBlur,
            enter: this.useEnter,
            delay: this.delay,
            parallel: this.delay === 0,
        });
        // Retry if input value does not match the requested value
        const { value: actualValue } = await el.getInfo(true);
        const valueMatches = !util.strEquals(actualValue, value, { onlyAlphaNumeric: true });
        if (this.checkAndRetry && valueMatches) {
            await new Promise(r => setTimeout(r, 500));
            await this.attemptInput(el, value, attempt - 1);
        }
    }
}
