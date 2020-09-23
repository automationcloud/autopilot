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

import { runtime } from '../../runtime';
import assert from 'assert';
import { GlobalsService } from '../../../main';

describe('Flow.each', () => {
    describe('non-empty', () => {
        function createScript() {
            return runtime.createScriptWithActions([
                {
                    id: 'each',
                    type: 'Flow.each',
                    pipeline: {
                        pipes: [
                            { type: 'DOM.queryAll', selector: 'button' },
                            { type: 'DOM.getText', selector: 'button' },
                        ],
                    },
                    children: [{ id: 'child', type: 'Flow.group' }],
                },
                { id: 'next', type: 'Flow.group' },
            ]);
        }

        it('enters loop', async () => {
            await runtime.goto('/buttons.html');
            const script = createScript();
            const loop = script.getActionById('each')!;
            const promise = script.run('action', loop);
            assert.equal(script.$playback.playhead!.id, 'each');
            await promise;
            assert.equal(script.$playback.playhead!.id, 'child');
        });

        it('maintains current element', async () => {
            await runtime.goto('/buttons.html');
            const script = createScript();
            const loop = script.getActionById('each') as any;
            await script.run('action', loop);

            assert.equal(loop.$iteration, 0);
            const currentEl = (await loop.resolveChildrenScope())[0];
            assert.equal(currentEl.remote.description, 'button');
            assert.equal(currentEl.value, 'English');
        });

        it('returns to the start of iteration at the end', async () => {
            await runtime.goto('/buttons.html');
            const script = createScript();
            const loop = script.getActionById('each');
            script.setPlayhead(loop);
            await script.step();
            assert.equal(script.$playback.playhead!.id, 'child');
            await script.step();
            assert.equal(script.$playback.playhead!.id, 'each');
            await script.step();
            assert.equal(script.$playback.playhead!.id, 'child');
        });

        it('iterates through all elements and leaves', async () => {
            await runtime.goto('/buttons.html');
            const script = createScript();
            const loop = script.getActionById('each') as any;
            script.setPlayhead(loop);

            for (let i = 0; i < 4; i += 1) {
                await script.step();
                assert.equal(script.$playback.playhead!.id, 'child');

                await script.step();
                assert.equal(script.$playback.playhead!.id, 'each');
                assert.equal(loop.$iteration, i);
            }

            await script.step();
            assert.equal(loop.$iteration, 4);
            assert.equal(script.$playback.playhead!.id, 'next');
        });
    });

    describe('iteration: data', () => {
        it('iterates over data', async () => {
            const script = runtime.createScriptWithActions([
                {
                    id: 'each',
                    type: 'Flow.each',
                    pipeline: {
                        pipes: [
                            {
                                type: 'Value.getJson',
                                value: JSON.stringify([{ name: 'one' }, { name: 'two' }, { name: 'three' }]),
                            },
                            { type: 'List.fromArray' },
                        ],
                    },
                    children: [{ id: 'child', type: 'Flow.group' }],
                },
            ]);
            await runtime.goto('/index.html');
            const getPlayheadTag = async () => {
                const action = script.$playback.playhead!;
                assert.equal(action.id, 'child');
                const scopeEl = (await action.resolveScope())[0];
                return scopeEl.value.name;
            };
            const loop = script.getActionById('each');
            script.setPlayhead(loop);
            await script.step();
            assert.equal(await getPlayheadTag(), 'one');
            await script.step();
            await script.step();
            assert.equal(await getPlayheadTag(), 'two');
            await script.step();
            await script.step();
            assert.equal(await getPlayheadTag(), 'three');
            await script.step();
            await script.step();
            assert(script.$playback.playhead == null);
        });
    });

    describe('integration: links + navigate', () => {
        it('visits different pages to collect data', async () => {
            await runtime.goto('/contexts/r.html');
            await runtime.runActions([
                {
                    type: 'Flow.each',
                    pipeline: [
                        { type: 'DOM.queryAll', selector: 'a' },
                    ],
                    children: [
                        {
                            type: 'Page.click',
                        },
                        {
                            type: 'Global.appendGlobal',
                            key: 'h1s',
                            pipeline: [
                                { type: 'DOM.document' },
                                { type: 'DOM.queryOne', selector: 'h1' },
                                { type: 'DOM.getText' },
                            ],
                        }
                    ]
                }
            ]);
            const globals = runtime.engine.get(GlobalsService).values;
            assert.deepEqual(globals, [{ key: 'h1s', value: ['R1', 'R2', 'R3', 'R4', 'R5'] }]);
        });
    });
});
