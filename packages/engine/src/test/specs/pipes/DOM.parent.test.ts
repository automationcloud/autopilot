import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/parent', () => {
    it('returns parent node', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '[value="fr"]',
            },
            {
                type: 'DOM.parent',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'select');
        assert.deepEqual(results[0].value, {});
    });

    it('traverses up the hierarchy', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '[value="fr"]',
            },
            {
                type: 'DOM.parent',
                count: 2,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'main');
        assert.deepEqual(results[0].value, {});
    });

    it('fails if no parent found', async () => {
        await runtime.goto('/select.html');
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'DOM.parent',
                },
            ]);
        });
    });

    it('produces 0 elements if not found + optional', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.parent',
                optional: true,
            },
        ]);
        assert.equal(results.length, 0);
    });
});
