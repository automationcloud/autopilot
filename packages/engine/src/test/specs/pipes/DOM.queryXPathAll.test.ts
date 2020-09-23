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

import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/query-xpath-all', () => {
    context('non-optional', () => {
        it('returns multiple elements', async () => {
            await runtime.goto('/buttons.html');
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathAll',
                    expression: '//button',
                },
            ]);
            assert.equal(results.length, 4);
            for (const el of results) {
                assert.equal(el.description, 'button');
            }
        });

        it('expands nested queires', async () => {
            await runtime.goto('/buttons.html');
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathAll',
                    expression: '//main',
                },
                {
                    type: 'DOM.queryXPathAll',
                    expression: './/button',
                },
            ]);
            assert.equal(results.length, 4);
            for (const el of results) {
                assert.equal(el.description, 'button');
            }
        });

        it('throws when no elements found', async () => {
            await runtime.goto('/buttons.html');
            await runtime.assertError('XpathNotFound', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryXPathAll',
                        expression: '//h6',
                    },
                ]);
            });
        });

        it('throws when expression searching non element node', async () => {
            await runtime.goto('/buttons.html');
            const span = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathAll',
                    expression: '//span[@class]',
                },
            ]);
            assert.equal(span.length, 1);
            await runtime.assertError('XpathNotFound', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryXPathAll',
                        expression: '//span/@class',
                    },
                ]);
            });
        });
    });

    context('optional', () => {
        it('returns 0 elements when not found', async () => {
            await runtime.goto('/index.html');
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathAll',
                    expression: '//h6',
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });

        it('returns 0 elements when expression searching non element node', async () => {
            await runtime.goto('/buttons.html');
            const span = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathAll',
                    expression: '//span[@class]',
                },
            ]);
            assert.equal(span.length, 1);
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathAll',
                    expression: '//span/@class',
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });
    });
});
