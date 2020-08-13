import { runtime } from '../../runtime';
import assert from 'assert';

describe('DOM.isSelected', () => {
    it('returns true if checked', async () => {
        await runtime.goto('/checkbox.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '#checked',
            },
            {
                type: 'DOM.isSelected',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'input#checked');
        assert.equal(results[0].value, true);
    });

    it('returns false if unchecked', async () => {
        await runtime.goto('/checkbox.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryOne',
                selector: '#unchecked',
            },
            {
                type: 'DOM.isSelected',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, 'input#unchecked');
        assert.equal(results[0].value, false);
    });
});
