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

describe('Pipes: value/get-input-dynamic', () => {
    it('returns input value', async () => {
        runtime.flow.inputs.push({
            key: 'foo-123',
            data: 'hello',
        });
        const results = await runtime.runPipes([
            {
                type: 'Value.getDynamicInput',
                pipeline: [
                    {
                        type: 'Value.getJson',
                        value: JSON.stringify('foo-123'),
                    },
                ],
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 'hello');
    });
});
