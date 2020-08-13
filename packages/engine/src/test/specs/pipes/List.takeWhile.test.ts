import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/take-while', () => {
    it('ltr: takes first elements that match predicate', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify(['foo', 'bar', 'baz', '', 'quux', 'qux']),
            },
            { type: 'List.fromArray' },
            {
                type: 'List.takeWhile',
                pipeline: {
                    pipes: [{ type: 'Value.isEmpty' }, { type: 'Boolean.not' }],
                },
            },
        ]);
        assert.equal(results.length, 3);
        assert.equal(results[0].value, 'foo');
        assert.equal(results[1].value, 'bar');
        assert.equal(results[2].value, 'baz');
    });

    it('rtl: takes last elements that match predicate', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify(['foo', 'bar', 'baz', '', 'quux', 'qux']),
            },
            { type: 'List.fromArray' },
            {
                type: 'List.takeWhile',
                direction: 'rtl',
                pipeline: {
                    pipes: [{ type: 'Value.isEmpty' }, { type: 'Boolean.not' }],
                },
            },
        ]);
        assert.equal(results.length, 2);
        assert.equal(results[0].value, 'quux');
        assert.equal(results[1].value, 'qux');
    });
});
