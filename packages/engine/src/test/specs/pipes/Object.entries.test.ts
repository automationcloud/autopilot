import { runtime } from '../../runtime';
import assert from 'assert';

describe('Object.entries', () => {
    it('returns tuples', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify([
                    { foo: 1, bar: 2 },
                    { bar: 3 },
                ]),
            },
            { type: 'List.fromArray' },
            {
                type: 'Object.entries'
            },
        ]);
        assert.equal(results.length, 3);
        assert.deepEqual(results[0].value, ['foo', 1]);
        assert.deepEqual(results[1].value, ['bar', 2]);
        assert.deepEqual(results[2].value, ['bar', 3]);
    });

    it('throws error if inputs are not objects', async () => {
        await runtime.assertError('ValueTypeError', () =>
            runtime.runPipes([
                {
                    type: 'Value.getJson',
                    value: JSON.stringify([
                        { foo: 1 },
                        'bar',
                    ]),
                },
                {
                    type: 'Object.entries'
                },
            ]));
    });
});
