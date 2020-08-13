import { runtime } from '../../runtime';
import assert from 'assert';

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
