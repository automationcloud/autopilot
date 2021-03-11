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

import assert from 'assert';

import { runtime } from '../../runtime';

describe('Pipes: other/filter', () => {
    it('filters elements by boolean condition', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: 'select option',
            },
            {
                type: 'DOM.getAttribute',
                attribute: 'value',
            },
            {
                type: 'List.filter',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.containsText',
                            text: 'e',
                        },
                    ],
                },
            },
        ]);
        assert.equal(results.length, 2);
        assert.equal(results[0].description, 'option');
        assert.equal(results[0].value, 'en');
        assert.equal(results[1].description, 'option');
        assert.equal(results[1].value, 'es');
    });
});
