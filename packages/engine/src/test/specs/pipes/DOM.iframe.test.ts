import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/iframe', () => {
    it('returns iframe document', async () => {
        await runtime.goto('/iframes/top.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '#frame1',
            },
            {
                type: 'DOM.iframe',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
    });

    it('throws if element is not iframe', async () => {
        await runtime.goto('/iframes/top.html');
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'DOM.queryOne',
                    selector: 'html',
                },
                {
                    type: 'DOM.iframe',
                },
            ]);
        });
    });
});
