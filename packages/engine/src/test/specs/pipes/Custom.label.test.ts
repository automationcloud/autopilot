import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/label', () => {
    it('executes inner pipeline', async () => {
        const result = await runtime.runPipes([
            {
                type: 'Custom.label',
                pipeline: {
                    pipes: [{ type: 'Value.getConstant', value: 'hi' }],
                },
            },
        ]);
        assert.equal(result.length, 1);
        assert.equal(result[0].value, 'hi');
    });
});
