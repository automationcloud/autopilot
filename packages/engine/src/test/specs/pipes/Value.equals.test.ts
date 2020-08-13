import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/equals', () => {
    it('returns true if value equals to text', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.equals',
                pipelineA: {
                    pipes: [
                        {
                            type: 'Value.getConstant',
                            value: 'hello world',
                        },
                    ],
                },
                pipelineB: {
                    pipes: [
                        {
                            type: 'Value.getConstant',
                            value: 'hello world',
                        },
                    ],
                },
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, true);
    });

    it('returns false if value does not equal to text', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.equals',
                pipelineA: {
                    pipes: [
                        {
                            type: 'Value.getConstant',
                            value: 'hello',
                        },
                    ],
                },
                pipelineB: {
                    pipes: [
                        {
                            type: 'Value.getConstant',
                            value: 'world',
                        },
                    ],
                },
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, false);
    });

    it('returns true if objects are equal', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.equals',
                pipelineA: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify({
                                foo: ' Hello ',
                                bar: {
                                    baz: ' World ',
                                },
                            }),
                        },
                    ],
                },
                pipelineB: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify({
                                foo: 'hello',
                                bar: {
                                    baz: 'world',
                                },
                            }),
                        },
                    ],
                },
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, true);
    });

    it('returns false if objects differ', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.equals',
                pipelineA: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify({
                                foo: ' Hello ',
                                bar: {
                                    baz: ' World ',
                                },
                            }),
                        },
                    ],
                },
                pipelineB: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify({
                                foo: 'hello',
                                bar: {
                                    baz: 'world',
                                    qux: 1,
                                },
                            }),
                        },
                    ],
                },
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, false);
    });
});
