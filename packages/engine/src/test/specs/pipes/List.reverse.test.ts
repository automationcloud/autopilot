import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/reverse', () => {
    it('reverses the elements', async () => {
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
                type: 'List.reverse',
            },
        ]);
        assert.equal(results.length, 4);
        for (const el of results) {
            assert.equal(el.description, 'option');
        }
        assert.deepEqual(
            results.map(_ => _.value),
            ['Español', 'Português', 'Français', 'English'],
        );
    });
});
