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

describe('List.countBy', () => {
    it('returns counts of groups', async () => {
        const result = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify([
                    { key: 'lemon' },
                    { key: 'orange' },
                    { key: 'apple' },
                    { key: 'apple' },
                    { key: 'orange' },
                    { key: 'orange' },
                ]),
            },
            { type: 'List.fromArray' },
            {
                type: 'List.countBy',
                pipeline: {
                    pipes: [{ type: 'Object.getPath', path: '/key' }],
                },
            },
        ]);
        assert.equal(result.length, 1);
        assert.deepEqual(result[0].value, {
            lemon: 1,
            apple: 2,
            orange: 3,
        });
    });
});
