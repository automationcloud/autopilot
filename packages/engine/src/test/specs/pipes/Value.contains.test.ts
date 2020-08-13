import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/contains', () => {
    describe('strings', () => {
        it('returns true if value contains text', async () => {
            const results = await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'The Quick Brown Fox Jumps Over The Lazy Dog',
                },
                {
                    type: 'Value.contains',
                    pipelineB: {
                        pipes: [
                            {
                                type: 'Value.getConstant',
                                value: 'brown fox',
                            },
                        ],
                    },
                },
            ]);
            assert.equal(results.length, 1);
            assert.equal(results[0].description, '#document');
            assert.equal(results[0].value, true);
        });

        it('returns false if value does not contain text', async () => {
            const results = await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'The Quick Brown Fox Jumps Over The Lazy Dog',
                },
                {
                    type: 'Value.contains',
                    pipelineB: {
                        pipes: [
                            {
                                type: 'Value.getConstant',
                                value: 'brown dog',
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
});
