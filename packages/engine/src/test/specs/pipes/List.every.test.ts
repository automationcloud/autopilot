import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/fold-all', () => {
    it('returns false if input contains false values', async () => {
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
                type: 'List.every',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].value, false);
    });

    it('returns true if input does not contain false values', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstantArray',
                values: [
                    { dataType: 'boolean', value: 'true' },
                    { dataType: 'boolean', value: 'true' },
                    { dataType: 'boolean', value: 'true' },
                ],
            },
            {
                type: 'List.every',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].value, true);
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
                    type: 'List.every',
                },
            ]);
        });
    });
});
