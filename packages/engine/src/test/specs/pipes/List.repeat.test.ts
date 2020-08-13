import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/repeat', () => {
    it('repeats elements specified number of times', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify([{ foo: 1 }, { foo: 2 }]),
            },
            { type: 'List.fromArray' },
            {
                type: 'List.repeat',
                pipeline: {
                    pipes: [{ type: 'Object.getPath', path: '/foo' }],
                },
            },
        ]);
        assert.equal(results.length, 3);
        assert.deepEqual(results[0].value, { foo: 1 });
        assert.deepEqual(results[1].value, { foo: 2 });
        assert.deepEqual(results[2].value, { foo: 2 });
    });
});
