import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/format-date', () => {
    it('formats date', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '2018-06-05 18:44:32',
            },
            {
                type: 'Date.format',
                format: 'HH:mm YY MMM DD ddd',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, '18:44 18 Jun 05 Tue');
    });

    it('throws if input is not a valid date', async () => {
        await runtime.assertError('PlaybackError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: '34',
                },
                {
                    type: 'Date.format',
                    format: '',
                },
            ]);
        });
    });

    it('throws if input is not a string', async () => {
        await runtime.assertError('ValueTypeError', async () => {
            await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: '40',
                    dataType: 'number',
                },
                {
                    type: 'Date.format',
                    format: '',
                },
            ]);
        });
    });
});
