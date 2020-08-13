import { runtime } from '../../runtime';
import assert from 'assert';

describe('Flow.output', () => {
    it('returns output', async () => {
        await runtime.runActions([
            {
                id: 'output',
                type: 'Flow.output',
                outputKey: 'foo',
                pipeline: {
                    pipes: [{ type: 'Value.getJson', value: JSON.stringify('hello') }],
                },
            },
        ]);
        const output = runtime.flow.outputs.find(o => o.key === 'foo')!;
        assert.ok(output);
        assert.equal(output.key, 'foo');
        assert.deepEqual(output.data, 'hello');
    });
});
