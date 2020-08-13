import { runtime } from '../../runtime';
import assert from 'assert';

describe('List.countBy', () => {
    it('returns counts of groups', async () => {
        const result = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify([
                    { key: 'lemon' },
                    { key: 'orange' },
                    { key: 'apple' },
                    { key: 'apple' },
                    { key: 'orange' },
                    { key: 'orange' },
                ]),
            },
            { type: 'List.fromArray' },
            {
                type: 'List.countBy',
                pipeline: {
                    pipes: [{ type: 'Object.getPath', path: '/key' }],
                },
            },
        ]);
        assert.equal(result.length, 1);
        assert.deepEqual(result[0].value, {
            lemon: 1,
            apple: 2,
            orange: 3,
        });
    });
});
