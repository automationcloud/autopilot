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

describe('Pipes: dom/query-all', () => {
    context('non-optional', () => {
        it('returns multiple elements with precached info', async () => {
            await runtime.goto('/buttons.html');
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryAll',
                    selector: 'button',
                },
            ]);
            assert.equal(results.length, 4);
            for (const el of results) {
                assert.equal(el.description, 'button');
                assert.ok(el.info);
            }
        });

        it('throws when no elements found', async () => {
            await runtime.goto('/buttons.html');
            await runtime.assertError('SelectorNotFound', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryAll',
                        selector: '.unknown',
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
                    type: 'DOM.queryAll',
                    selector: 'h6',
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });
    });
});
