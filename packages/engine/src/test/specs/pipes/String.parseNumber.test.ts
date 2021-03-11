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

describe('Pipes: value/parse-number', () => {
    it('parses float from string', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '2.71828',
            },
            {
                type: 'String.parseNumber',
                float: true,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 2.71828);
    });

    it('parses integer from string', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '2.71828',
            },
            {
                type: 'String.parseNumber',
                float: false,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 2);
    });

    it('throws if number cannot be parsed', async () => {
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'hello',
                },
                {
                    type: 'String.parseNumber',
                },
            ]);
        });
    });

    it('returns null if number parsing failed and optional', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: 'hello',
            },
            {
                type: 'String.parseNumber',
                optional: true,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, null);
    });
});
