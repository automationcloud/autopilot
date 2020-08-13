import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/filter', () => {
    it('filters elements by boolean condition', async () => {
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
            {
                type: 'List.filter',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.containsText',
                            text: 'e',
                        },
                    ],
                },
            },
        ]);
        assert.equal(results.length, 2);
        assert.equal(results[0].description, 'option');
        assert.equal(results[0].value, 'en');
        assert.equal(results[1].description, 'option');
        assert.equal(results[1].value, 'es');
    });
});
