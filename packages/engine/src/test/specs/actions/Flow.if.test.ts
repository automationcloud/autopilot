import { runtime } from '../../runtime';
import assert from 'assert';

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
