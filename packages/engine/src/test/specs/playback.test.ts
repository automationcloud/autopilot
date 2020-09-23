// Copyright 2020 Ubio Limited
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

import { runtime } from '../runtime';
import assert from 'assert';

describe('Playback', () => {
    describe('mode: action', () => {
        it('executes single action and advances playhead', async () => {
            const script = runtime.createScriptWithActions([
                { id: 'a1', type: 'Flow.group' },
                { id: 'a2', type: 'Flow.group' },
            ]);
            const a1 = script.getActionById('a1');
            const promise = script.run('action', a1);
            assert.equal(script.$playback.playhead!.id, 'a1');
            await promise;
            assert.equal(script.$playback.playhead!.id, 'a2');
        });

        it('enters into complex action', async () => {
            const script = runtime.createScriptWithActions([
                {
                    id: 'a1',
                    type: 'Flow.group',
                    children: [{ id: 'a11', type: 'Flow.group' }],
                },
            ]);
            const a1 = script.getActionById('a1');
            const promise = script.run('action', a1);
            assert.equal(script.$playback.playhead!.id, 'a1');
            await promise;
            assert.equal(script.$playback.playhead!.id, 'a11');
        });

        it('leaves complex action', async () => {
            const script = runtime.createScriptWithActions([
                {
                    id: 'a1',
                    type: 'Flow.group',
                    children: [{ id: 'a11', type: 'Flow.group' }],
                },
                { id: 'a2', type: 'Flow.group' },
            ]);
            const a11 = script.getActionById('a11');
            const promise = script.run('action', a11);
            assert.equal(script.$playback.playhead!.id, 'a11');
            await promise;
            assert.equal(script.$playback.playhead!.id, 'a2');
        });

        it('skips empty group', async () => {
            const script = runtime.createScriptWithActions([
                { id: 'a1', type: 'Flow.group', children: [] },
                { id: 'a2', type: 'Flow.group', children: [] },
            ]);
            const a1 = script.getActionById('a1');
            const promise = script.run('action', a1);
            assert.equal(script.$playback.playhead!.id, 'a1');
            await promise;
            assert.equal(script.$playback.playhead!.id, 'a2');
        });

        it('leaves context after playing last action', async () => {
            const script = runtime.createScriptWithActions([
                { id: 'a1', type: 'Flow.group', children: [] },
                { id: 'a2', type: 'Flow.group', children: [] },
            ]);
            const a2 = script.getActionById('a2');
            const promise = script.run('action', a2);
            assert.equal(script.$playback.playhead!.id, 'a2');
            await promise;
            assert(script.$playback.playhead == null);
        });

        it('edge case: leaves last inner group recursively', async () => {
            const script = runtime.createScriptWithActions([
                {
                    id: 'a1',
                    type: 'Flow.group',
                    children: [
                        {
                            id: 'a11',
                            type: 'Flow.group',
                            children: [{ id: 'a111', type: 'Flow.group', children: [] }],
                        },
                    ],
                },
                { id: 'a2', type: 'Flow.group', children: [] },
            ]);
            const a111 = script.getActionById('a111');
            const promise = script.run('action', a111);
            assert.equal(script.$playback.playhead!.id, 'a111');
            await promise;
            assert.equal(script.$playback.playhead!.id, 'a2');
        });

        it('corner case: leaves context after leaving last inner group', async () => {
            const script = runtime.createScriptWithActions([
                {
                    id: 'a1',
                    type: 'Flow.group',
                    children: [
                        {
                            id: 'a11',
                            type: 'Flow.group',
                            children: [{ id: 'a111', type: 'Flow.group', children: [] }],
                        },
                    ],
                },
            ]);
            const a111 = script.getActionById('a111');
            const promise = script.run('action', a111);
            assert.equal(script.$playback.playhead!.id, 'a111');
            await promise;
            assert(script.$playback.playhead == null);
        });
    });
});
