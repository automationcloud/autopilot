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

describe('Pipes: other/repeat', () => {
    it('repeats elements specified number of times', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify([{ foo: 1 }, { foo: 2 }]),
            },
            { type: 'List.fromArray' },
            {
                type: 'List.repeat',
                pipeline: {
                    pipes: [{ type: 'Object.getPath', path: '/foo' }],
                },
            },
        ]);
        assert.equal(results.length, 3);
        assert.deepEqual(results[0].value, { foo: 1 });
        assert.deepEqual(results[1].value, { foo: 2 });
        assert.deepEqual(results[2].value, { foo: 2 });
    });
});
