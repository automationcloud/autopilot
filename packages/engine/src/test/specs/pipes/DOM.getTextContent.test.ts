import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/text-content', () => {
    it('returns text content', async () => {
        await runtime.goto('/buttons.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: 'h1',
            },
            {
                type: 'DOM.getTextContent',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'h1');
        assert.equal(results[0].value, 'Your language is: English');
    });
});
