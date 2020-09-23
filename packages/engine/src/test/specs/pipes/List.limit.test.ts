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

describe('Pipes: other/limit', () => {
    it('limits the elements', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: 'select option',
                optional: true,
            },
            {
                type: 'DOM.getText',
            },
            {
                type: 'List.limit',
                count: 2,
            },
        ]);
        assert.equal(results.length, 2);
        assert.equal(results[0].description, 'option');
        assert.equal(results[0].value, 'English');
        assert.equal(results[1].description, 'option');
        assert.equal(results[1].value, 'Français');
    });
});
