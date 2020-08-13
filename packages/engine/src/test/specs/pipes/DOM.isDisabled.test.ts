import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/is-disabled', () => {
    it('returns false if not disabled', async () => {
        await runtime.goto('/checkbox.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '#checked',
            },
            {
                type: 'DOM.isDisabled',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'input#checked');
        assert.equal(results[0].value, false);
    });

    it('returns true if disabled', async () => {
        await runtime.goto('/checkbox.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '#disabled',
            },
            {
                type: 'DOM.isDisabled',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'input#disabled');
        assert.equal(results[0].value, true);
    });
});
