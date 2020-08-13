import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/set-path', () => {
    it('sets JSON path on object', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify({
                    foo: 42,
                }),
            },
            {
                type: 'Object.setPath',
                path: '/bar/baz',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getConstant',
                            value: 'hi',
                        },
                    ],
                },
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.deepEqual(results[0].value, {
            foo: 42,
            bar: {
                baz: 'hi',
            },
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
                    type: 'Object.setPath',
                    path: '/boo',
                    pipeline: {
                        pipes: [
                            {
                                type: 'Value.getConstant',
                                value: 'hi',
                            },
                        ],
                    },
                },
            ]);
        });
    });
});
