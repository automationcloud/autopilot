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

describe('Pipes: value/numeric-compare', () => {
    const tests = [
        { op: 'equals', a: 1, b: 1, result: true },
        { op: 'equals', a: 1, b: 2, result: false },
        { op: 'not equals', a: 1, b: 2, result: true },
        { op: 'not equals', a: 1, b: 1, result: false },
        { op: 'greater than', a: 0, b: 1, result: false },
        { op: 'greater than', a: 1, b: 1, result: false },
        { op: 'greater than', a: 2, b: 1, result: true },
        { op: 'greater than or equals to', a: 0, b: 1, result: false },
        { op: 'greater than or equals to', a: 1, b: 1, result: true },
        { op: 'greater than or equals to', a: 2, b: 1, result: true },
        { op: 'less than', a: 0, b: 1, result: true },
        { op: 'less than', a: 1, b: 1, result: false },
        { op: 'less than', a: 2, b: 1, result: false },
        { op: 'less than or equals to', a: 0, b: 1, result: true },
        { op: 'less than or equals to', a: 1, b: 1, result: true },
        { op: 'less than or equals to', a: 2, b: 1, result: false },
    ];

    for (const { op, a, b, result } of tests) {
        it(`${a} ${op} ${b} is ${result}`, async () => {
            const results = await runtime.runPipes([
                {
                    type: 'Number.compare',
                    operator: op,
                    pipelineA: {
                        pipes: [
                            {
                                type: 'Value.getJson',
                                value: a.toString(),
                            },
                        ],
                    },
                    pipelineB: {
                        pipes: [
                            {
                                type: 'Value.getJson',
                                value: b.toString(),
                            },
                        ],
                    },
                },
            ]);
            assert.equal(results.length, 1);
            assert.equal(results[0].description, '#document');
            assert.equal(results[0].value, result);
        });
    }
});
