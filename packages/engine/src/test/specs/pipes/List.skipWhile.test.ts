import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/skip-while', () => {
    it('ltr: discards first elements that match predicate', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify(['foo', 'bar', 'baz', '', 'quux', 'qux']),
            },
            { type: 'List.fromArray' },
            {
                type: 'List.skipWhile',
                pipeline: {
                    pipes: [{ type: 'Value.isEmpty' }, { type: 'Boolean.not' }],
                },
            },
        ]);
        assert.equal(results.length, 3);
        assert.equal(results[0].value, '');
        assert.equal(results[1].value, 'quux');
        assert.equal(results[2].value, 'qux');
    });

    it('rtl: discards last elements that match predicate', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify(['foo', 'bar', 'baz', '', 'quux', 'qux']),
            },
            { type: 'List.fromArray' },
            {
                type: 'List.skipWhile',
                direction: 'rtl',
                pipeline: {
                    pipes: [{ type: 'Value.isEmpty' }, { type: 'Boolean.not' }],
                },
            },
        ]);
        assert.equal(results.length, 4);
        assert.equal(results[0].value, 'foo');
        assert.equal(results[1].value, 'bar');
        assert.equal(results[2].value, 'baz');
        assert.equal(results[3].value, '');
    });
});
