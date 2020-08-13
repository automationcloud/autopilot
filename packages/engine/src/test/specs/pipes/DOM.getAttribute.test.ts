import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/attribute', () => {
    it('returns an attribute', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: 'select option',
            },
            {
                type: 'DOM.getAttribute',
                attribute: 'value',
            },
        ]);
        assert.equal(results.length, 4);
        assert.equal(results[0].description, 'option');
        assert.equal(results[0].value, 'en');
        assert.equal(results[1].description, 'option');
        assert.equal(results[1].value, 'fr');
        assert.equal(results[2].description, 'option');
        assert.equal(results[2].value, 'pt');
        assert.equal(results[3].description, 'option');
        assert.equal(results[3].value, 'es');
    });

    it('throws when no attribute found', async () => {
        await runtime.goto('/select.html');
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'DOM.queryAll',
                    selector: 'select option',
                },
                {
                    type: 'DOM.getAttribute',
                    attribute: 'wtf',
                },
            ]);
        });
    });

    it('returns null when not found and optional', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: 'select option',
            },
            {
                type: 'DOM.getAttribute',
                attribute: 'wtf',
                optional: true,
            },
        ]);
        assert.equal(results.length, '4');
        for (const res of results) {
            assert.equal(res.description, 'option');
            assert.equal(res.value, null);
        }
    });
});
