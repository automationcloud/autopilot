import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/get-input-dynamic', () => {
    it('returns input value', async () => {
        runtime.flow.inputs.push({
            key: 'foo-123',
            data: 'hello',
        });
        const results = await runtime.runPipes([
            {
                type: 'Value.getDynamicInput',
                pipeline: [
                    {
                        type: 'Value.getJson',
                        value: JSON.stringify('foo-123'),
                    },
                ],
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 'hello');
    });
});
