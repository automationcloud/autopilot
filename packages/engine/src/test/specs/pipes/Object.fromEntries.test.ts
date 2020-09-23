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

import { runtime } from '../../runtime';
import assert from 'assert';

describe('Object.fromEntries', () => {
    it('returns an object collected from entries', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify([
                    { key: 'foo', value: 1 },
                    { key: 'bar', value: 3 },
                ]),
            },
            { type: 'List.fromArray' },
            {
                type: 'Object.fromEntries',
                keyPath: '/key',
                valuePath: '/value',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.deepEqual(results[0].value, { foo: 1, bar: 3 });
    });

    context('onMissingKey: error', () => {
        it('throws error if key not found', async () => {
            await runtime.assertError('PlaybackError', () =>
                runtime.runPipes([
                    {
                        type: 'Value.getJson',
                        value: JSON.stringify([
                            { key: 'foo', value: 1 },
                            { key1: 'bar', value: 3 },
                        ]),
                    },
                    { type: 'List.fromArray' },
                    {
                        type: 'Object.fromEntries',
                        keyPath: '/key',
                        valuePath: '/value',
                        onMissingKey: 'error',
                    },
                ]));
        });
    });

    context('onMissingValue: error', () => {
        it('throws error if value not found', async () => {
            await runtime.assertError('PlaybackError', () =>
                runtime.runPipes([
                    {
                        type: 'Value.getJson',
                        value: JSON.stringify([
                            { key: 'foo', value: 1 },
                            { key: 'bar', value1: 3 },
                        ]),
                    },
                    { type: 'List.fromArray' },
                    {
                        type: 'Object.fromEntries',
                        keyPath: '/key',
                        valuePath: '/value',
                        onMissingValue: 'error',
                    },
                ]));
        });
    });
});
