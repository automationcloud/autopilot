import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/query-xpath-one', () => {
    context('non-optional', () => {
        it('returns single element', async () => {
            await runtime.goto('/index.html');
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathOne',
                    expression: '//h1',
                },
            ]);
            assert.equal(results.length, 1);
            assert.equal(results[0].description, 'h1#hello');
            assert.deepEqual(results[0].value, {});
        });

        it('throws when no elements found', async () => {
            await runtime.goto('/index.html');
            await runtime.assertError('XpathNotFound', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryXPathOne',
                        expression: '//unknown',
                    },
                ]);
            });
        });

        it('throws when multiple elements found', async () => {
            await runtime.goto('/buttons.html');
            await runtime.assertError('XpathAmbiguous', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryXPathOne',
                        expression: '//button',
                    },
                ]);
            });
        });

        it('throws when expression searching non element node', async () => {
            await runtime.goto('/buttons.html');
            const span = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathOne',
                    expression: '//span[@class]',
                },
            ]);
            assert.equal(span.length, 1);
            await runtime.assertError('XpathNotFound', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryXPathOne',
                        expression: '//span/@class',
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
                    type: 'DOM.queryXPathOne',
                    expression: '//h6',
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });
    });
});
