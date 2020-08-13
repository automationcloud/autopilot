import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/expression', () => {
    it('acts as a get path when starts with /', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify({ foo: { bar: 42 } }),
            },
            {
                type: 'Eval.expression',
                expression: '/foo/bar',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 42);
    });

    it('executes JavaScript when starts with =', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify({ foo: 42, bar: 21 }),
            },
            {
                type: 'Eval.expression',
                expression: '= foo + this.bar',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.equal(results[0].value, 63);
    });
});
