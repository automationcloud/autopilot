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

import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/query-one', () => {
    context('non-optional', () => {
        it('returns single element', async () => {
            await runtime.goto('/index.html');
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryOne',
                    selector: 'h1',
                },
            ]);
            assert.equal(results.length, 1);
            assert.equal(results[0].description, 'h1#hello');
            assert.deepEqual(results[0].value, {});
        });

        it('throws when no elements found', async () => {
            await runtime.goto('/index.html');
            await runtime.assertError('SelectorNotFound', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryOne',
                        selector: '.unknown',
                    },
                ]);
            });
        });

        it('throws when multiple elements found', async () => {
            await runtime.goto('/buttons.html');
            await runtime.assertError('SelectorAmbiguous', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryOne',
                        selector: 'button',
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
                    type: 'DOM.queryOne',
                    selector: 'h6',
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });
    });
});
