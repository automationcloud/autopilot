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
import { Extension, Action, Script } from '../../main';

describe('Script', () => {
    describe('matchNextContext', () => {
        beforeEach(() => runtime.page.navigate('about:blank'));

        it('should match single top-level context unambiguously', async () => {
            const script = await runtime.getScript('contexts');
            await runtime.goto('/contexts/a1.html');
            await script.run('action', null);
            const ctx = script.$playback.playhead!.$context;
            assert.equal(ctx.id, 'a1');
        });

        it('should prefer first context when multiple match', async () => {
            const script = await runtime.getScript('contexts');
            await runtime.goto('/contexts/a1-a2.html');
            await script.run('action', null);
            const ctx = script.$playback.playhead!.$context;
            assert.equal(ctx.id, 'a1');
        });

        it('should not match already visited contexts', async () => {
            const script = await runtime.getScript('contexts');
            await runtime.goto('/contexts/a1-a2.html');
            const context = script.getContextById('a1')!;
            context.$runtime.visited = 1;
            await script.run('action', null);
            const ctx = script.$playback.playhead!.$context;
            assert.equal(ctx.id, 'a2');
        });

        it('enters re-enterable context with a delay to allow for page load', async () => {
            const script = await runtime.getScript('contexts');
            const context = script.getContextById('r')!;
            assert.equal(context.$runtime.visited, 0);
            await runtime.goto('/contexts/r.html?page=1');
            // First visit the context once
            await script.run('action', null);
            assert.equal(context.$runtime.visited, 1);
            assert.equal(script.$playback.lastContext!.id, 'r');
            // Now trigger the nav and immediately ask to match next context
            runtime.goto('/contexts/r.html?page=2').catch(() => {});
            await script.run('action', null);
            const ctx = script.$playback.playhead!.$context;
            const h1 = await runtime.page.querySelector('h1');
            const { text } = await h1!.getInfo();
            assert.equal(text, 'R2');
            assert.equal(ctx.id, 'r');
        });

        it('throws ContextLimitError with custom error code after no contexts match', async () => {
            const script = await runtime.getScript('contexts');
            const context = script.getContextById('interstitial')!;
            // Mark it as visited so that it doesn't match
            context.$runtime.visited = 1;
            await runtime.goto('/contexts/interstitial.html');
            await runtime.assertError('customErrorCode', async () => {
                await script.run('action', null);
            });
        });

        it('throws NoContextsMatch when no contexts match', async () => {
            const script = await runtime.getScript('contexts');
            await runtime.goto('/index.html');
            await runtime.assertError('NoContextsMatch', async () => {
                await script.run('action', null);
            });
        });
    });

    describe('load', () => {

        beforeEach(() => {
            runtime.$registry.loadedExtensions = [];
            runtime.$registry.mockExtensionLoading = true;
        });

        context('dependency does not exist in registry', () => {
            it('throws ExtensionNotFound error', async () => {
                try {
                    await Script.load(runtime.engine, {
                        dependencies: [
                            { name: '@automationcloud/extension-unknown', version: '50.0.0' },
                        ]
                    });
                    throw new Error('UnexpectedSuccess');
                } catch (err) {
                    assert.equal(err.name, 'ExtensionNotFound');
                }
            });
        });

        context('exact version requested, exists in registry', () => {
            it('loads script with its dependencies', async () => {
                const script = await Script.load(runtime.engine, {
                    dependencies: [
                        { name: '@automationcloud/extension-test', version: '2.5.3' },
                    ]
                });
                assert(script instanceof Script);
                assert.equal(runtime.$registry.loadedExtensions.length, 1);
                assert.equal(runtime.$registry.loadedExtensions[0].name, '@automationcloud/extension-test');
                assert.equal(runtime.$registry.loadedExtensions[0].version, '2.5.3');
            });
        });

        context('specific version requested, does not exist in registry', () => {
            it('throws ExtensionVersionNotFound error', async () => {
                try {
                    await Script.load(runtime.engine, {
                        dependencies: [
                            { name: '@automationcloud/extension-test', version: '50.0.0' },
                        ]
                    });
                    throw new Error('UnexpectedSuccess');
                } catch (err) {
                    assert.equal(err.name, 'ExtensionVersionNotFound');
                }
            });
        });

        context('range requested, exists in registry', () => {
            it('loads script with latest version satisfying the dependency range', async () => {
                const script = await Script.load(runtime.engine, {
                    dependencies: [
                        { name: '@automationcloud/extension-test', version: '^2.5.0' },
                    ]
                });
                assert(script instanceof Script);
                assert.equal(runtime.$registry.loadedExtensions.length, 1);
                assert.equal(runtime.$registry.loadedExtensions[0].name, '@automationcloud/extension-test');
                assert.equal(runtime.$registry.loadedExtensions[0].version, '2.5.4');
            });
        });

        context('range requested, no matches found in registry', () => {
            it('throws ExtensionVersionNotFound error', async () => {
                try {
                    await Script.load(runtime.engine, {
                        dependencies: [
                            { name: '@automationcloud/extension-test', version: '^50.0.0' },
                        ]
                    });
                    throw new Error('UnexpectedSuccess');
                } catch (err) {
                    assert.equal(err.name, 'ExtensionVersionNotFound');
                }
            });
        });

    });

    describe('dependencies', () => {
        // We add a fake action that depends on @automationcloud/test-extension here.
        class FakeAction extends Action {
            static $type = 'sayHi';
            static $help = '';
            async exec() {}
        }

        beforeEach(async () => {
            const ext = await Extension.load(runtime.getAssetFile('extensions/test'));
            ext.spec.version = '3.0.1';
            ext.init = function() {
                this.actionClasses = [FakeAction];
                this.pipeClasses = [];
                return this;
            };
            runtime.$resolver.addExtension(ext);
        });

        it('resolves actions from dependencies', () => {
            const script = runtime.createScript({
                contexts: [
                    {
                        type: 'main',
                        children: [
                            {
                                type: 'Flow.expect',
                            },
                            {
                                type: 'sayHi',
                            },
                        ],
                    },
                ],
            });
            const actions = [...script.allActions()];
            assert.equal(actions[0].type, 'Flow.expect');
            assert.equal(actions[1].type, 'sayHi');
            assert(actions[1] instanceof FakeAction);
        });

        it('lists actually used dependencies', () => {
            const script = runtime.createScript({
                contexts: [
                    {
                        type: 'main',
                        children: [
                            {
                                type: 'sayHi',
                            },
                        ],
                    },
                ],
            });
            const depsBefore = [...script.collectUsedDependencies()];
            assert.deepEqual(depsBefore, [{ name: '@automationcloud/extension-test', version: '3.0.1' }]);
            // Now remove that action and see what's what
            script.getMainContext().children.removeAt(0);
            const depsAfter = [...script.collectUsedDependencies()];
            assert.deepEqual(depsAfter, []);
        });
    });

    describe('contexts', () => {
        it('<main> always exists', () => {
            const script = runtime.createScript({
                contexts: [],
            });
            const mainContexts = script.contexts.filter(_ => _.type === 'main');
            assert.equal(mainContexts.length, 1);
        });

        it('only single <main> is allowed', () => {
            const script = runtime.createScript({
                contexts: [{ type: 'main' }, { type: 'main' }],
            });
            const mainContexts = script.contexts.filter(_ => _.type === 'main');
            assert.equal(mainContexts.length, 1);
        });

        it('only single <checkpoint> is allowed', () => {
            const script = runtime.createScript({
                contexts: [{ type: 'checkpoint' }, { type: 'checkpoint' }],
            });
            const mainContexts = script.contexts.filter(_ => _.type === 'checkpoint');
            assert.equal(mainContexts.length, 1);
        });

        it('<main> and <checkpoint> are moved to top automatically', () => {
            const script = runtime.createScript({
                contexts: [
                    { id: 'a', type: 'context' },
                    { id: 'b', type: 'checkpoint' },
                    { id: 'c', type: 'main' },
                ],
            });
            assert.equal(script.getMainContext().$index, 0);
            assert.equal(script.getCheckpointContext()?.$index, 1);
            assert.deepEqual(
                script.contexts.map(_ => _.id),
                ['c', 'b', 'a'],
            );
        });
    });

    describe('getActionById', () => {
        it('performs search in all contexts', () => {
            const script = runtime.createScript({
                contexts: [
                    {
                        type: 'main',
                        actions: [{ id: 'a1', type: 'noop' }],
                    },
                    {
                        type: 'context',
                        actions: [{ id: 'b1', type: 'noop' }],
                    },
                ],
            });
            const b1 = script.getActionById('b1');
            assert.ok(b1);
        });

        it('performs search recursively in sub-actions', () => {
            const script = runtime.createScriptWithActions([
                { id: 'a1', type: 'Flow.group', children: [] },
                {
                    id: 'a2',
                    type: 'Flow.group',
                    children: [
                        { id: 'a21', type: 'Flow.group', children: [] },
                        { id: 'a22', type: 'Flow.group', children: [] },
                    ],
                },
            ]);
            const a22 = script.getActionById('a22');
            assert.ok(a22);
        });

        it('returns null if not found', () => {
            const script = runtime.createScriptWithActions([]);
            const unknown = script.getActionById('unknown');
            assert(unknown == null);
        });
    });
});
