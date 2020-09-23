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

describe('Pipes: value/parse-color', () => {
    it('parses color from string', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '#f00',
            },
            {
                type: 'String.parseColor',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.deepEqual(results[0].value.rgb, [255, 0, 0]);
        assert.equal(results[0].value.hex, '#ff0000');
    });

    it('throws if no color parsed', async () => {
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: '42',
                },
                {
                    type: 'String.parseColor',
                },
            ]);
        });
    });

    it('returns null if color parsing failed and optional', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '42',
            },
            {
                type: 'String.parseColor',
                optional: true,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, null);
    });
});
