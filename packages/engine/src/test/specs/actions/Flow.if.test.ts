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

describe('Flow.if', () => {
    it('enters when condition is satisfied', async () => {
        const script = runtime.createScriptWithActions([
            {
                id: 'if',
                type: 'Flow.if',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: 'true',
                        },
                    ],
                },
                children: [{ id: 'child', type: 'Flow.group' }],
            },
            { id: 'next', type: 'Flow.group' },
        ]);
        const action = script.getActionById('if')!;
        const promise = script.run('action', action);
        assert.equal(script.$playback.playhead!.id, 'if');
        await promise;
        assert.equal(script.$playback.playhead!.id, 'child');
        assert.equal(action.$runtime.bypassed, false);
    });

    it('skips when condition is not satisfied', async () => {
        const script = runtime.createScriptWithActions([
            {
                id: 'if',
                type: 'Flow.if',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: 'false',
                        },
                    ],
                },
                children: [{ id: 'child', type: 'Flow.group' }],
            },
            { id: 'next', type: 'Flow.group' },
        ]);
        const action = script.getActionById('if')!;
        const promise = script.run('action', action);
        assert.equal(script.$playback.playhead!.id, 'if');
        await promise;
        assert.equal(script.$playback.playhead!.id, 'next');
        assert.equal(action.$runtime.bypassed, true);
    });

    it('exits from block regardless of condition', async () => {
        const script = runtime.createScriptWithActions([
            {
                id: 'if',
                type: 'Flow.if',
                children: [{ id: 'child', type: 'Flow.group' }],
            },
            { id: 'next', type: 'Flow.group' },
        ]);
        const action = script.getActionById('child')!;
        const promise = script.run('action', action);
        assert.equal(script.$playback.playhead!.id, 'child');
        await promise;
        assert.equal(script.$playback.playhead!.id, 'next');
    });
});
