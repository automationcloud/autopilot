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

describe('Flow.resetInput', () => {
    it('returns resetInput', async () => {
        await runtime.runActions([
            {
                id: 'reset-input',
                type: 'Flow.resetInput',
                inputKey: 'foo',
            },
        ]);
        const input = runtime.flow.inputs.find(o => o.key === 'foo')!;
        assert.equal(input, null);
    });
});
