import { runtime } from '../../runtime';
import assert from 'assert';

describe('Boolean.not', () => {
    it('negates boolean', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: 'true',
                dataType: 'boolean',
            },
            {
                type: 'Boolean.not',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, false);
    });

    it('throws if input is not a boolean', async () => {
        await runtime.assertError('ValueTypeError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'foo',
                },
                {
                    type: 'Boolean.not',
                },
            ]);
        });
    });
});
