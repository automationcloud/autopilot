import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/query-one', () => {
    context('non-optional', () => {
        it('returns single element', async () => {
            await runtime.goto('/index.html');
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryOne',
                    selector: 'h1',
                },
            ]);
            assert.equal(results.length, 1);
            assert.equal(results[0].description, 'h1#hello');
            assert.deepEqual(results[0].value, {});
        });

        it('throws when no elements found', async () => {
            await runtime.goto('/index.html');
            await runtime.assertError('SelectorNotFound', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryOne',
                        selector: '.unknown',
                    },
                ]);
            });
        });

        it('throws when multiple elements found', async () => {
            await runtime.goto('/buttons.html');
            await runtime.assertError('SelectorAmbiguous', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryOne',
                        selector: 'button',
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
                    type: 'DOM.queryOne',
                    selector: 'h6',
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });
    });
});
