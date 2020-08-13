import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/batch-extract', () => {
    it('returns a batch info', async () => {
        await runtime.goto('/integration/flights.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: '.flight',
            },
            {
                type: 'DOM.batchExtract',
                properties: [
                    {
                        key: 'from',
                        selector: '.flight-from',
                    },
                    {
                        key: 'to',
                        selector: '.flight-to',
                    },
                    {
                        key: 'price',
                        selector: '.flight-price',
                    },
                ],
            },
        ]);
        assert.equal(results.length, 162);
        for (const res of results) {
            assert.ok(res.value.from);
            assert.ok(res.value.to);
            assert.ok(res.value.price);
        }
    });
});
