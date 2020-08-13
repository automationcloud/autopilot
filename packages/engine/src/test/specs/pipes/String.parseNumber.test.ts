import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/parse-number', () => {
    it('parses float from string', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '2.71828',
            },
            {
                type: 'String.parseNumber',
                float: true,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 2.71828);
    });

    it('parses integer from string', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '2.71828',
            },
            {
                type: 'String.parseNumber',
                float: false,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 2);
    });

    it('throws if number cannot be parsed', async () => {
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'hello',
                },
                {
                    type: 'String.parseNumber',
                },
            ]);
        });
    });

    it('returns null if number parsing failed and optional', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: 'hello',
            },
            {
                type: 'String.parseNumber',
                optional: true,
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, null);
    });
});
