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

describe('Pipes: value/extract-regexp', () => {
    context('match single', () => {
        it('extracts matching groups', async () => {
            const results = await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'Apples: 50',
                },
                {
                    type: 'String.extractRegexp',
                    regexp: '(\\w+): (\\d+)',
                    matchAll: false,
                },
            ]);
            assert.equal(results.length, 1);
            assert.equal(results[0].description, '#document');
            assert.deepEqual(results[0].value, ['Apples: 50', 'Apples', '50']);
        });

        it('non-optional: throws if value does not match', async () => {
            await runtime.assertError('PlaybackError', async () => {
                await runtime.runPipes([
                    {
                        type: 'Value.getConstant',
                        value: 'Apples: foo',
                    },
                    {
                        type: 'String.extractRegexp',
                        regexp: '(\\w+): (\\d+)',
                        matchAll: false,
                    },
                ]);
            });
        });

        it('optional: discards if value does not match', async () => {
            const results = await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'Apples: foo',
                },
                {
                    type: 'String.extractRegexp',
                    regexp: '(\\w+): (\\d+)',
                    matchAll: false,
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });
    });

    context('match all', () => {
        it('extracts matching groups from all matches', async () => {
            const results = await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'Apples: 50, Bananas: 20',
                },
                {
                    type: 'String.extractRegexp',
                    regexp: '(\\w+): (\\d+)',
                    matchAll: true,
                },
            ]);
            assert.equal(results.length, 2);
            assert.equal(results[0].description, '#document');
            assert.deepEqual(results[0].value, ['Apples: 50', 'Apples', '50']);
            assert.deepEqual(results[1].value, ['Bananas: 20', 'Bananas', '20']);
        });

        it('non-optional: throws if value does not match', async () => {
            await runtime.assertError('PlaybackError', async () => {
                await runtime.runPipes([
                    {
                        type: 'Value.getConstant',
                        value: 'Apples: foo',
                    },
                    {
                        type: 'String.extractRegexp',
                        regexp: '(\\w+): (\\d+)',
                        matchAll: true,
                    },
                ]);
            });
        });

        it('optional: discards if value does not match', async () => {
            const results = await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'Apples: foo',
                },
                {
                    type: 'String.extractRegexp',
                    regexp: '(\\w+): (\\d+)',
                    matchAll: true,
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });
    });
});
