import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/fold-exists', () => {
    it('returns true if elements exist', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: 'select option',
                optional: true,
            },
            {
                type: 'List.exists',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, true);
    });

    it('returns false if no elements exist', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: '.idk',
                optional: true,
            },
            {
                type: 'List.exists',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, false);
    });
});
