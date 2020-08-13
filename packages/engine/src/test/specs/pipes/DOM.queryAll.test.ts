import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/query-all', () => {
    context('non-optional', () => {
        it('returns multiple elements with precached info', async () => {
            await runtime.goto('/buttons.html');
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryAll',
                    selector: 'button',
                },
            ]);
            assert.equal(results.length, 4);
            for (const el of results) {
                assert.equal(el.description, 'button');
                assert.ok(el.info);
            }
        });

        it('throws when no elements found', async () => {
            await runtime.goto('/buttons.html');
            await runtime.assertError('SelectorNotFound', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryAll',
                        selector: '.unknown',
                    },
                ]);
            });
        });
    });

    context('optional', () => {
        it('returns 0 elements when not found', async () => {
            await runtime.goto('/index.html');
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryAll',
                    selector: 'h6',
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });
    });
});
