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

describe('Flow.outputEvent', () => {
    it('sends output event with type and details', async () => {
        await runtime.runActions([
            {
                id: 'outputEvent',
                type: 'Flow.outputEvent',
                eventType: 'foo',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify({
                                foo: 'bar',
                                details: 123,
                            }),
                        },
                    ],
                },
            },
        ]);
        const output = runtime.flow.outputs.find(o => o.key.startsWith('events'))!;
        assert.ok(output);
        assert.ok(output.key.startsWith('events:'));
        assert.deepEqual(output.data.type, 'foo');
        assert.deepEqual(output.data, {
            type: 'foo',
            foo: 'bar',
            details: 123,
        });
    });

    it('sends output event with evaluated type', async () => {
        await runtime.runActions([
            {
                id: 'output',
                type: 'Flow.outputEvent',
                eventType: 'foo',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify({
                                type: 'bar',
                                foo: 'bar',
                                details: 123,
                            }),
                        },
                    ],
                },
            },
        ]);
        const output = runtime.flow.outputs.find(o => o.key.startsWith('events'))!;
        assert.ok(output);
        assert.ok(output.key.startsWith('events:'));
        assert.deepEqual(output.data.type, 'bar');
        assert.deepEqual(output.data, {
            type: 'bar',
            foo: 'bar',
            details: 123,
        });
    });
});
