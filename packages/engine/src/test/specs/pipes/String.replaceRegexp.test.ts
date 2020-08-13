import { runtime } from '../../runtime';
import assert from 'assert';

describe('String.replaceRegexp', () => {
    it('applies template formatting', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getConstant',
                value: '- Hello - World -',
            },
            {
                type: 'String.replaceRegexp',
                regexp: '\\s*-\\s*',
                replacement: '',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 'HelloWorld');
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
                    type: 'String.replaceRegexp',
                    regexp: 'foo',
                    replacement: '',
                },
            ]);
        });
    });
});
