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

describe('Data.saveLocal', () => {
    it('save/restore locals', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify(['foo', 'bar', 'baz']),
            },
            { type: 'List.fromArray' },
            { type: 'Data.saveLocal', key: 'hi' },
            {
                type: 'List.append',
                pipeline: {
                    pipes: [{ type: 'Data.restoreLocal', key: 'hi' }],
                },
            },
        ]);
        assert.equal(results.length, 6);
        const values = results.map(el => el.value);
        assert.deepEqual(values, ['foo', 'bar', 'baz', 'foo', 'bar', 'baz']);
    });
});
