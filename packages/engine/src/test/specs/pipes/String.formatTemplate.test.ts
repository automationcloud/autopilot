import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/format-template', () => {
    it('applies template formatting', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify({
                    foo: {
                        bar: 42,
                    },
                    baz: 'Hi',
                }),
            },
            {
                type: 'String.formatTemplate',
                template: '- {/baz} {/foo/bar} -',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, '- Hi 42 -');
    });

    it('throws if input is not an object', async () => {
        await runtime.assertError('ValueTypeError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'foo',
                },
                {
                    type: 'String.formatTemplate',
                    template: '',
                },
            ]);
        });
    });
});
