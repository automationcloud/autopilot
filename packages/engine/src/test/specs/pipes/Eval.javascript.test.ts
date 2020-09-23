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

describe('Pipes: other/javascript', () => {
    it('mode: element', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: 'select option',
                optional: true,
            },
            { type: 'DOM.getText' },
            {
                type: 'Eval.javascript',
                mode: 'element',
                expression: 'return el.clone(el.value.split("").reverse().join(""))',
            },
        ]);
        assert.equal(results.length, 4);
        for (const el of results) {
            assert.equal(el.description, 'option');
        }
        assert.equal(results[0].value, 'hsilgnE');
        assert.equal(results[1].value, 'siaçnarF');
        assert.equal(results[2].value, 'sêugutroP');
        assert.equal(results[3].value, 'loñapsE');
    });

    it('mode: collection', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: 'select option',
                optional: true,
            },
            { type: 'DOM.getText' },
            {
                type: 'Eval.javascript',
                mode: 'collection',
                expression: 'return inputSet.slice(1,3).reverse()',
            },
        ]);
        assert.equal(results.length, 2);
        for (const el of results) {
            assert.equal(el.description, 'option');
        }
        assert.equal(results[0].value, 'Português');
        assert.equal(results[1].value, 'Français');
    });
});
