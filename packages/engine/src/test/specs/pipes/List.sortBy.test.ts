import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/sort-by', () => {
    it('sorts the elements by predicate', async () => {
        await runtime.goto('/select.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: 'select option',
            },
            {
                type: 'Object.setPath',
                path: '/lang',
                pipeline: {
                    pipes: [{ type: 'DOM.getText' }],
                },
            },
            {
                type: 'List.sortBy',
                pipeline: {
                    pipes: [
                        {
                            type: 'Object.getPath',
                            path: '/lang',
                        },
                    ],
                },
            },
        ]);
        assert.equal(results.length, 4);
        for (const el of results) {
            assert.equal(el.description, 'option');
        }
        assert.deepEqual(
            results.map(_ => _.value),
            [{ lang: 'English' }, { lang: 'Español' }, { lang: 'Français' }, { lang: 'Português' }],
        );
    });
});
