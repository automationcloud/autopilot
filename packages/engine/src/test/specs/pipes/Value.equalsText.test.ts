import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/equals-text', () => {
    it('returns true if value equals to text', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: 'Hello World',
            },
            {
                type: 'Value.equalsText',
                text: 'hello world',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, true);
    });

    it('returns false if value does not equal to text', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: 'Hello World',
            },
            {
                type: 'Value.equalsText',
                text: 'world',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, false);
    });
});
