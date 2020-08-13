import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/next-sibling', () => {
    it('returns next sibling', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '[value="fr"]',
            },
            {
                type: 'DOM.nextSibling',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'option');
        assert.deepEqual(results[0].value, {});
        const {
            attributes: { value },
        } = await results[0].getInfo();
        assert.equal(value, 'pt');
    });

    it('works with count', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '[value="fr"]',
            },
            {
                type: 'DOM.nextSibling',
                count: 2,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'option');
        assert.deepEqual(results[0].value, {});
        const {
            attributes: { value },
        } = await results[0].getInfo();
        assert.equal(value, 'es');
    });

    it('fails if no next sibling found', async () => {
        await runtime.goto('/select.html');
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'DOM.queryOne',
                    selector: '[value="es"]',
                },
                {
                    type: 'DOM.nextSibling',
                },
            ]);
        });
    });

    it('produces 0 elements if not found + optional', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '[value="es"]',
            },
            {
                type: 'DOM.nextSibling',
                optional: true,
            },
        ]);
        assert.equal(results.length, 0);
    });
});
