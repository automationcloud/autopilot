import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/numeric-compare', () => {
    const tests = [
        { op: 'equals', a: 1, b: 1, result: true },
        { op: 'equals', a: 1, b: 2, result: false },
        { op: 'not equals', a: 1, b: 2, result: true },
        { op: 'not equals', a: 1, b: 1, result: false },
        { op: 'greater than', a: 0, b: 1, result: false },
        { op: 'greater than', a: 1, b: 1, result: false },
        { op: 'greater than', a: 2, b: 1, result: true },
        { op: 'greater than or equals to', a: 0, b: 1, result: false },
        { op: 'greater than or equals to', a: 1, b: 1, result: true },
        { op: 'greater than or equals to', a: 2, b: 1, result: true },
        { op: 'less than', a: 0, b: 1, result: true },
        { op: 'less than', a: 1, b: 1, result: false },
        { op: 'less than', a: 2, b: 1, result: false },
        { op: 'less than or equals to', a: 0, b: 1, result: true },
        { op: 'less than or equals to', a: 1, b: 1, result: true },
        { op: 'less than or equals to', a: 2, b: 1, result: false },
    ];

    for (const { op, a, b, result } of tests) {
        it(`${a} ${op} ${b} is ${result}`, async () => {
            const results = await runtime.runPipes([
                {
                    type: 'Number.compare',
                    operator: op,
                    pipelineA: {
                        pipes: [
                            {
                                type: 'Value.getJson',
                                value: a.toString(),
                            },
                        ],
                    },
                    pipelineB: {
                        pipes: [
                            {
                                type: 'Value.getJson',
                                value: b.toString(),
                            },
                        ],
                    },
                },
            ]);
            assert.equal(results.length, 1);
            assert.equal(results[0].description, '#document');
            assert.equal(results[0].value, result);
        });
    }
});
