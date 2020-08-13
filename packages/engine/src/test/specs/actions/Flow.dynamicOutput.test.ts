import { runtime } from '../../runtime';
import assert from 'assert';

describe('Flow.dynamicOutput', () => {
    it('sends output with evaluated key and data', async () => {
        await runtime.runActions([
            {
                id: 'output',
                type: 'Flow.dynamicOutput',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify({
                                key: 'foo',
                                data: 'hello',
                            }),
                        },
                    ],
                },
            },
        ]);
        const output = runtime.flow.outputs.find(o => o.key === 'foo')!;
        assert.ok(output);
        assert.equal(output.key, 'foo');
        assert.deepEqual(output.data, 'hello');
    });

    it('hashes the suffix of output key', async () => {
        await runtime.runActions([
            {
                id: 'output',
                type: 'Flow.dynamicOutput',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify({
                                key: 'foo:123',
                                data: 'hello',
                            }),
                        },
                    ],
                },
            },
        ]);
        const output = runtime.flow.outputs.find(o => o.key.startsWith('foo'))!;
        assert.ok(output);
        assert.equal(output.key, 'foo:40bd001563085fc35165329ea1ff5c5ecbdbbeef');
        assert.deepEqual(output.data, 'hello');
    });
});
