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

describe('Pipes: value/contains-text', () => {
    it('returns true if value contains text', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: 'Hello World',
            },
            {
                type: 'Value.containsText',
                text: 'world',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, true);
    });

    it('returns false if value does not contain text', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: 'Hello World',
            },
            {
                type: 'Value.containsText',
                text: 'world1',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, false);
    });
});
