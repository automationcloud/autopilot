import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/has-class', () => {
    it('returns true if class exists', async () => {
        await runtime.goto('/buttons.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '.lang',
            },
            {
                type: 'DOM.hasClass',
                className: 'lang',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'span.lang');
        assert.equal(results[0].value, true);
    });

    it('returns false if class exists', async () => {
        await runtime.goto('/buttons.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '.lang',
            },
            {
                type: 'DOM.hasClass',
                className: 'bang',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'span.lang');
        assert.equal(results[0].value, false);
    });
});
