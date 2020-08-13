import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/get-json', () => {
    it('returns a parsed json', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify({ foo: { bar: 42 } }),
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.deepEqual(results[0].value, { foo: { bar: 42 } });
    });
});
