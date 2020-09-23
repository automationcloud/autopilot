// Copyright 2020 UBIO Limited
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

import { runtime } from '../../runtime';
import assert from 'assert';

describe('Page.click', () => {
    it('clicks element', async () => {
        await runtime.runActions([
            {
                type: 'Page.navigate',
                pipeline: {
                    pipes: [{ type: 'Value.getConstant', value: runtime.getUrl('/click.html') }],
                },
            },
            {
                type: 'Page.click',
                pipeline: {
                    pipes: [{ type: 'DOM.queryOne', selector: 'button' }],
                },
            },
        ]);
        const submitted = await runtime.page.querySelector('.submitted');
        assert(submitted != null);
    });

    it('clicks element obscured by overlay', async () => {
        await runtime.runActions([
            {
                type: 'Page.navigate',
                pipeline: {
                    pipes: [{ type: 'Value.getConstant', value: runtime.getUrl('/click-overlay.html') }],
                },
            },
            {
                type: 'Page.click',
                pipeline: {
                    pipes: [{ type: 'DOM.queryOne', selector: 'button' }],
                },
            },
        ]);
        const submitted = await runtime.page.querySelector('.submitted');
        const { text } = await submitted!.getInfo();
        assert.equal(text, 'Submitted');
    });

    it('throws if element is not visible', async () => {
        await runtime.assertError('ElementNotVisible', async () => {
            await runtime.runActions([
                {
                    type: 'Page.navigate',
                    pipeline: {
                        pipes: [{ type: 'Value.getConstant', value: runtime.getUrl('/invisible.html') }],
                    },
                },
                {
                    type: 'Page.click',
                    pipeline: {
                        pipes: [{ type: 'DOM.queryOne', selector: 'a.invisible' }],
                    },
                },
            ]);
        });
    });

    it('clicks options', async () => {
        await runtime.runActions([
            {
                type: 'Page.navigate',
                pipeline: {
                    pipes: [{ type: 'Value.getConstant', value: runtime.getUrl('/select.html') }],
                },
            },
            {
                type: 'Page.click',
                pipeline: {
                    pipes: [{ type: 'DOM.queryOne', selector: 'option:nth-child(2)' }],
                },
            },
        ]);
        const h1 = await runtime.page.querySelector('h1');
        const { text } = await h1!.getInfo();
        assert.equal(text, 'Your language is: Français');
    });
});
