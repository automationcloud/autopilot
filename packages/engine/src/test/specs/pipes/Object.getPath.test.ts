import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/get-path', () => {
    it('retrieves JSON path from object', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify({
                    foo: 42,
                }),
            },
            {
                type: 'Object.getPath',
                path: '/foo',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 42);
    });

    it('throws if input is not an object', async () => {
        await runtime.assertError('ValueTypeError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'foo',
                },
                {
                    type: 'Object.getPath',
                    path: '/foo',
                },
            ]);
        });
    });

    it('throws if path not found', async () => {
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getJson',
                    value: JSON.stringify({
                        foo: 42,
                    }),
                },
                {
                    type: 'Object.getPath',
                    path: '/foo/bar',
                },
            ]);
        });
    });
});
