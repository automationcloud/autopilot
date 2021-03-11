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

describe('Flow.find', () => {
    describe('control flow', () => {
        it('enters when element is found', async () => {
            const script = runtime.createScriptWithActions([
                {
                    id: 'find',
                    type: 'Flow.find',
                    pipeline: {
                        pipes: [{ type: 'DOM.queryOne', selector: 'main' }],
                    },
                    children: [{ id: 'child', type: 'Flow.group' }],
                },
            ]);
            await runtime.goto('/buttons.html');
            const action = script.getActionById('find')!;
            await script.run('action', action);
            assert.equal(script.$playback.playhead!.id, 'child');
            assert.equal(action.$runtime.bypassed, false);
        });

        it('throws if element not found', async () => {
            const script = runtime.createScriptWithActions([
                {
                    id: 'find',
                    type: 'Flow.find',
                    pipeline: {
                        pipes: [{ type: 'DOM.queryOne', selector: '.unknown', optional: true }],
                    },
                    children: [{ id: 'child', type: 'Flow.group' }],
                },
            ]);
            await runtime.goto('/buttons.html');
            const action = script.getActionById('find');
            await runtime.assertError('NoResults', async () => {
                await script.run('action', action);
            });
        });

        it('skips if element not found and optional', async () => {
            const script = runtime.createScriptWithActions([
                {
                    id: 'find',
                    type: 'Flow.find',
                    optional: true,
                    pipeline: {
                        pipes: [{ type: 'DOM.queryOne', selector: '.unknown', optional: true }],
                    },
                    children: [{ id: 'child', type: 'Flow.group' }],
                },
            ]);
            await runtime.goto('/buttons.html');
            const action = script.getActionById('find')!;
            await script.run('action', action);
            assert(script.$playback.playhead == null);
            assert.equal(action.$runtime.bypassed, true);
        });

        it('throws if multiple elements found, even if optional', async () => {
            const script = runtime.createScriptWithActions([
                {
                    id: 'find',
                    type: 'Flow.find',
                    optional: true,
                    pipeline: {
                        pipes: [{ type: 'DOM.queryAll', selector: 'button' }],
                    },
                    children: [{ id: 'child', type: 'Flow.group' }],
                },
            ]);
            await runtime.goto('/buttons.html');
            const action = script.getActionById('find');
            await runtime.assertError('AmbiguousResults', async () => {
                await script.run('action', action);
            });
        });
    });

    describe('scope', () => {
        it('provides scope to children', async () => {
            const script = runtime.createScriptWithActions([
                {
                    id: 'find',
                    type: 'Flow.find',
                    pipeline: {
                        pipes: [{ type: 'DOM.queryOne', selector: 'main' }],
                    },
                    children: [{ id: 'child', type: 'Flow.group' }],
                },
            ]);
            await runtime.goto('/buttons.html');
            const child = script.getActionById('child')!;
            const inputSet = await child.resolveScope();
            assert.equal(inputSet.length, 1);
            assert.equal(inputSet[0].description, 'main');
        });
    });
});
