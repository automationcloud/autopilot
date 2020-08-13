import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/fold-any', () => {
    it('returns true if input contains true values', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstantArray',
                values: [
                    { dataType: 'boolean', value: 'false' },
                    { dataType: 'boolean', value: 'true' },
                    { dataType: 'boolean', value: 'false' },
                ],
            },
            {
                type: 'List.some',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].value, true);
    });

    it('returns false if input does not contain true values', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstantArray',
                values: [
                    { dataType: 'boolean', value: 'false' },
                    { dataType: 'boolean', value: 'false' },
                    { dataType: 'boolean', value: 'false' },
                ],
            },
            {
                type: 'List.some',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].value, false);
    });

    it('throws if input contains non-boolean values', async () => {
        await runtime.assertError('ValueTypeError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstantArray',
                    values: [
                        { dataType: 'string', value: 'hi' },
                        { dataType: 'boolean', value: 'true' },
                        { dataType: 'boolean', value: 'false' },
                    ],
                },
                {
                    type: 'List.some',
                },
            ]);
        });
    });
});
