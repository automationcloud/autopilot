import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/get-constant', () => {
    it('returns a string', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: 'foo',
                dataType: 'string',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 'foo');
    });

    it('returns a number', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '42',
                dataType: 'number',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 42);
    });

    it('returns a boolean', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: 'true',
                dataType: 'boolean',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, true);
    });

    it('throws when number cannot be parsed', async () => {
        await runtime.assertError('InvalidScript', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'foo',
                    dataType: 'number',
                },
            ]);
        });
    });

    it('throws when boolean cannot be parsed', async () => {
        await runtime.assertError('InvalidScript', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'foo',
                    dataType: 'boolean',
                },
            ]);
        });
    });
});
