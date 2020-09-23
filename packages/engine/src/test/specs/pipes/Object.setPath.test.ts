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

describe('Pipes: value/set-path', () => {
    it('sets JSON path on object', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify({
                    foo: 42,
                }),
            },
            {
                type: 'Object.setPath',
                path: '/bar/baz',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getConstant',
                            value: 'hi',
                        },
                    ],
                },
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.deepEqual(results[0].value, {
            foo: 42,
            bar: {
                baz: 'hi',
            },
        });
    });

    it('throws if input is not an object', async () => {
        await runtime.assertError('ValueTypeError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'foo',
                },
                {
                    type: 'Object.setPath',
                    path: '/boo',
                    pipeline: {
                        pipes: [
                            {
                                type: 'Value.getConstant',
                                value: 'hi',
                            },
                        ],
                    },
                },
            ]);
        });
    });
});
