import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/if-else', () => {
    it('executes different pipelines based on condition', async () => {
        const result = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: '["hello", "world", "hi"]',
            },
            { type: 'List.fromArray' },
            {
                type: 'Eval.ifElse',
                pipelineCondition: {
                    pipes: [{ type: 'Value.containsText', text: 'h' }],
                },
                pipelinePositive: {
                    pipes: [{ type: 'Value.getConstant', value: '1' }],
                },
                pipelineNegative: {
                    pipes: [{ type: 'Value.getConstant', value: '2' }],
                },
            },
        ]);
        assert.equal(result.length, 3);
        assert.equal(result[0].value, '1');
        assert.equal(result[1].value, '2');
        assert.equal(result[2].value, '1');
    });
});
