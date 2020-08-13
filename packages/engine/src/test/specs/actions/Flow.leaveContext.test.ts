import { runtime } from '../../runtime';
import assert from 'assert';

describe('Flow.leaveContext', () => {
    it('sets playhead to null', async () => {
        const script = runtime.createScriptWithActions([
            { id: 'leave', type: 'Flow.leaveContext' },
            { id: 'next', type: 'Flow.group' },
        ]);
        await runtime.goto('/index.html');
        const leave = script.getActionById('leave');
        const promise = script.run('action', leave);
        assert.equal(script.$playback.playhead!.id, 'leave');
        await promise;
        assert(script.$playback.playhead == null);
    });
});
