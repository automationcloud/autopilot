import { runtime } from '../../runtime';
import assert from 'assert';

describe('Object.pick', () => {
    it('returns object with keys filtered', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify({
                    foo: 16,
                    bar: 32,
                    baz: 64,
                }),
            },
            {
                type: 'Object.pick',
                keys: ['foo', 'baz'],
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.deepEqual(results[0].value, {
            foo: 16,
            baz: 64,
        });
    });

    it('throws if input is not an object', async () => {
        await runtime.assertError('ValueTypeError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'foo',
                },
                {
                    type: 'Object.pick',
                    keys: [],
                },
            ]);
        });
    });
});
