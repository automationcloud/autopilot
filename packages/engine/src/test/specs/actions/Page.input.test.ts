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

describe('Page.input', () => {
    it('types text into element', async () => {
        await runtime.runActions([
            {
                type: 'Page.navigate',
                pipeline: {
                    pipes: [{ type: 'Value.getConstant', value: runtime.getUrl('/input.html') }],
                },
            },
            {
                type: 'Page.input',
                pipeline: {
                    pipes: [
                        { type: 'DOM.queryOne', selector: 'input' },
                        { type: 'Value.getConstant', value: 'Adélaïde' },
                    ],
                },
            },
        ]);
        const h1 = await runtime.page.querySelector('h1');
        const { text } = await h1!.getInfo();
        assert.equal(text, 'Your name is: Adélaïde');
    });
});
