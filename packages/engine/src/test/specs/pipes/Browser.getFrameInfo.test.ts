import { runtime } from '../../runtime';
import assert from 'assert';

describe('Browser.getFrameInfo', () => {
    it('returns frame information', async () => {
        await runtime.goto('/iframes/top.html');
        await runtime.page.waitForLoad();
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '#frame1',
            },
            { type: 'DOM.iframe' },
            {
                type: 'Browser.getFrameInfo',
            },
        ]);
        assert.equal(results.length, 1);
        assert.ok(results[0].value.frameId);
        assert.ok(results[0].value.url);
        assert.ok(results[0].value.url.endsWith('/first-level.html'));
        assert.ok(results[0].value.ready);
        assert.ok(results[0].value.loaded);
        assert.ok(!results[0].value.failed);
    });
});
