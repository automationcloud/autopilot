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

describe('Pipes: dom/next-sibling', () => {
    it('returns next sibling', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '[value="fr"]',
            },
            {
                type: 'DOM.nextSibling',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'option');
        assert.deepEqual(results[0].value, {});
        const {
            attributes: { value },
        } = await results[0].getInfo();
        assert.equal(value, 'pt');
    });

    it('works with count', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '[value="fr"]',
            },
            {
                type: 'DOM.nextSibling',
                count: 2,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'option');
        assert.deepEqual(results[0].value, {});
        const {
            attributes: { value },
        } = await results[0].getInfo();
        assert.equal(value, 'es');
    });

    it('fails if no next sibling found', async () => {
        await runtime.goto('/select.html');
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'DOM.queryOne',
                    selector: '[value="es"]',
                },
                {
                    type: 'DOM.nextSibling',
                },
            ]);
        });
    });

    it('produces 0 elements if not found + optional', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '[value="es"]',
            },
            {
                type: 'DOM.nextSibling',
                optional: true,
            },
        ]);
        assert.equal(results.length, 0);
    });
});
