import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/parse-color', () => {
    it('parses color from string', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '#f00',
            },
            {
                type: 'String.parseColor',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.deepEqual(results[0].value.rgb, [255, 0, 0]);
        assert.equal(results[0].value.hex, '#ff0000');
    });

    it('throws if no color parsed', async () => {
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: '42',
                },
                {
                    type: 'String.parseColor',
                },
            ]);
        });
    });

    it('returns null if color parsing failed and optional', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '42',
            },
            {
                type: 'String.parseColor',
                optional: true,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, null);
    });
});
