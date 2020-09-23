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

import { runtime } from '../../runtime';
import assert from 'assert';

describe('Flow.while', () => {
    it('iterates whilst condition is true', async () => {
        await runtime.runActions([
            {
                type: 'Page.navigate',
                pipeline: {
                    pipes: [{ type: 'Value.getConstant', value: runtime.getUrl('/input.html') }],
                },
            },
            {
                type: 'Flow.while',
                pipeline: {
                    pipes: [
                        { type: 'DOM.queryOne', selector: 'input' },
                        { type: 'DOM.getValue' },
                        { type: 'Value.equalsText', text: '11111' },
                        { type: 'Boolean.not' },
                    ],
                },
                children: [
                    {
                        type: 'Page.input',
                        useClear: false,
                        checkAndRetry: false,
                        pipeline: {
                            pipes: [
                                { type: 'DOM.queryOne', selector: 'input' },
                                { type: 'Value.getConstant', value: '1' },
                            ],
                        },
                    },
                ],
            },
        ]);
        const input = await runtime.page.querySelector('input');
        const { value } = await input!.getInfo();
        assert.equal(value, '11111');
    });

    it('throws when iteration limit is exceeded', async () => {
        await runtime.goto('/input.html');
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runActions([
                {
                    type: 'Flow.while',
                    pipeline: {
                        pipes: [
                            { type: 'DOM.queryOne', selector: 'input' },
                            { type: 'DOM.getValue' },
                            { type: 'Value.equalsText', text: '11111' },
                            { type: 'Boolean.not' },
                        ],
                    },
                },
            ]);
        });
    });
});
