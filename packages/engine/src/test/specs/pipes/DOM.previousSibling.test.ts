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

describe('Pipes: dom/previous-sibling', () => {
    it('returns previous sibling', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '[value="fr"]',
            },
            {
                type: 'DOM.previousSibling',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'option');
        assert.deepEqual(results[0].value, {});
        const {
            attributes: { value },
        } = await results[0].getInfo();
        assert.equal(value, 'en');
    });

    it('works with count', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '[value="pt"]',
            },
            {
                type: 'DOM.previousSibling',
                count: 2,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'option');
        assert.deepEqual(results[0].value, {});
        const {
            attributes: { value },
        } = await results[0].getInfo();
        assert.equal(value, 'en');
    });

    it('fails if no previous sibling found', async () => {
        await runtime.goto('/select.html');
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'DOM.queryOne',
                    selector: '[value="en"]',
                },
                {
                    type: 'DOM.previousSibling',
                },
            ]);
        });
    });

    it('produces 0 elements if not found + optional', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '[value="en"]',
            },
            {
                type: 'DOM.previousSibling',
                optional: true,
            },
        ]);
        assert.equal(results.length, 0);
    });
});
