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

describe('Value.getConstant', () => {
    it('returns a string', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: 'foo',
                dataType: 'string',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 'foo');
    });

    it('returns a number', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '42',
                dataType: 'number',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 42);
    });

    it('returns a boolean', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: 'true',
                dataType: 'boolean',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, true);
    });

    it('throws when number cannot be parsed', async () => {
        await runtime.assertError('InvalidScript', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'foo',
                    dataType: 'number',
                },
            ]);
        });
    });

    it('throws when boolean cannot be parsed', async () => {
        await runtime.assertError('InvalidScript', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'foo',
                    dataType: 'boolean',
                },
            ]);
        });
    });
});
