import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/is-visible', () => {
    it('returns true if element is visible', async () => {
        await runtime.goto('/invisible.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: 'h1',
            },
            {
                type: 'DOM.isVisible',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'h1');
        assert.equal(results[0].value, true);
    });

    it('returns false if element is display: none', async () => {
        await runtime.goto('/invisible.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '.invisible',
            },
            {
                type: 'DOM.isVisible',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'a.invisible');
        assert.equal(results[0].value, false);
    });

    it('returns false if element is visibility: hidden', async () => {
        await runtime.goto('/invisible.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '.hidden',
            },
            {
                type: 'DOM.isVisible',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'a.hidden');
        assert.equal(results[0].value, false);
    });
});
