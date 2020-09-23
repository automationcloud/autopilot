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

describe('Pipes: other/if-else', () => {
    it('executes different pipelines based on condition', async () => {
        const result = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: '["hello", "world", "hi"]',
            },
            { type: 'List.fromArray' },
            {
                type: 'Eval.ifElse',
                pipelineCondition: {
                    pipes: [{ type: 'Value.containsText', text: 'h' }],
                },
                pipelinePositive: {
                    pipes: [{ type: 'Value.getConstant', value: '1' }],
                },
                pipelineNegative: {
                    pipes: [{ type: 'Value.getConstant', value: '2' }],
                },
            },
        ]);
        assert.equal(result.length, 3);
        assert.equal(result[0].value, '1');
        assert.equal(result[1].value, '2');
        assert.equal(result[2].value, '1');
    });
});
