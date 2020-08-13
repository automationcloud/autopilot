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
