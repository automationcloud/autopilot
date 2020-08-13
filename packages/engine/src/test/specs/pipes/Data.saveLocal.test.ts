import { runtime } from '../../runtime';
import assert from 'assert';

describe('Data.saveLocal', () => {
    it('save/restore locals', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify(['foo', 'bar', 'baz']),
            },
            { type: 'List.fromArray' },
            { type: 'Data.saveLocal', key: 'hi' },
            {
                type: 'List.append',
                pipeline: {
                    pipes: [{ type: 'Data.restoreLocal', key: 'hi' }],
                },
            },
        ]);
        assert.equal(results.length, 6);
        const values = results.map(el => el.value);
        assert.deepEqual(values, ['foo', 'bar', 'baz', 'foo', 'bar', 'baz']);
    });
});
