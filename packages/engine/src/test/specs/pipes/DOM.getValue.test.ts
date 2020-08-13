import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/value', () => {
    it('returns value', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: 'select',
            },
            {
                type: 'DOM.getValue',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'select');
        assert.equal(results[0].value, 'en');
    });

    it('returns null if no value and optional', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: 'main',
            },
            {
                type: 'DOM.getValue',
                optional: true,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'main');
        assert.equal(results[0].value, '');
    });
});
