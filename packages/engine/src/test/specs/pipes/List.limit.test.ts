import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/limit', () => {
    it('limits the elements', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: 'select option',
                optional: true,
            },
            {
                type: 'DOM.getText',
            },
            {
                type: 'List.limit',
                count: 2,
            },
        ]);
        assert.equal(results.length, 2);
        assert.equal(results[0].description, 'option');
        assert.equal(results[0].value, 'English');
        assert.equal(results[1].description, 'option');
        assert.equal(results[1].value, 'Français');
    });
});
