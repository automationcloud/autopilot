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

describe('Pipes: other/take-while', () => {
    it('ltr: takes first elements that match predicate', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify(['foo', 'bar', 'baz', '', 'quux', 'qux']),
            },
            { type: 'List.fromArray' },
            {
                type: 'List.takeWhile',
                pipeline: {
                    pipes: [{ type: 'Value.isEmpty' }, { type: 'Boolean.not' }],
                },
            },
        ]);
        assert.equal(results.length, 3);
        assert.equal(results[0].value, 'foo');
        assert.equal(results[1].value, 'bar');
        assert.equal(results[2].value, 'baz');
    });

    it('rtl: takes last elements that match predicate', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify(['foo', 'bar', 'baz', '', 'quux', 'qux']),
            },
            { type: 'List.fromArray' },
            {
                type: 'List.takeWhile',
                direction: 'rtl',
                pipeline: {
                    pipes: [{ type: 'Value.isEmpty' }, { type: 'Boolean.not' }],
                },
            },
        ]);
        assert.equal(results.length, 2);
        assert.equal(results[0].value, 'quux');
        assert.equal(results[1].value, 'qux');
    });
});
