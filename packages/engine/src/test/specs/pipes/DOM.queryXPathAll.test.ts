import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/query-xpath-all', () => {
    context('non-optional', () => {
        it('returns multiple elements', async () => {
            await runtime.goto('/buttons.html');
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathAll',
                    expression: '//button',
                },
            ]);
            assert.equal(results.length, 4);
            for (const el of results) {
                assert.equal(el.description, 'button');
            }
        });

        it('expands nested queires', async () => {
            await runtime.goto('/buttons.html');
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathAll',
                    expression: '//main',
                },
                {
                    type: 'DOM.queryXPathAll',
                    expression: './/button',
                },
            ]);
            assert.equal(results.length, 4);
            for (const el of results) {
                assert.equal(el.description, 'button');
            }
        });

        it('throws when no elements found', async () => {
            await runtime.goto('/buttons.html');
            await runtime.assertError('XpathNotFound', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryXPathAll',
                        expression: '//h6',
                    },
                ]);
            });
        });

        it('throws when expression searching non element node', async () => {
            await runtime.goto('/buttons.html');
            const span = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathAll',
                    expression: '//span[@class]',
                },
            ]);
            assert.equal(span.length, 1);
            await runtime.assertError('XpathNotFound', async () => {
                await runtime.runPipes([
                    {
                        type: 'DOM.queryXPathAll',
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
                    type: 'DOM.queryXPathAll',
                    expression: '//h6',
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });

        it('returns 0 elements when expression searching non element node', async () => {
            await runtime.goto('/buttons.html');
            const span = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathAll',
                    expression: '//span[@class]',
                },
            ]);
            assert.equal(span.length, 1);
            const results = await runtime.runPipes([
                {
                    type: 'DOM.queryXPathAll',
                    expression: '//span/@class',
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });
    });
});
