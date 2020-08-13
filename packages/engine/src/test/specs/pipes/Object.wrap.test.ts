import { runtime } from '../../runtime';
import assert from 'assert';

describe('Object.wrap', () => {
    it('wraps value into an object', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify([1, 2, 3]),
            },
            { type: 'List.fromArray' },
            {
                type: 'Object.wrap',
                path: '/number',
            },
        ]);
        assert.equal(results.length, 3);
        assert.deepEqual(
            results.map(_ => _.value),
            [{ number: 1 }, { number: 2 }, { number: 3 }],
        );
    });
});
