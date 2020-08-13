import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/fold-array', () => {
    it('creates an array from collection', async () => {
        await runtime.goto('/buttons.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: 'button',
            },
            {
                type: 'DOM.getText',
            },
            {
                type: 'List.toArray',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.deepEqual(results[0].value, ['English', 'Français', 'Português', 'Español']);
    });
});
