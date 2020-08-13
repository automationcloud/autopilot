import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/extract-regexp', () => {
    context('match single', () => {
        it('extracts matching groups', async () => {
            const results = await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'Apples: 50',
                },
                {
                    type: 'String.extractRegexp',
                    regexp: '(\\w+): (\\d+)',
                    matchAll: false,
                },
            ]);
            assert.equal(results.length, 1);
            assert.equal(results[0].description, '#document');
            assert.deepEqual(results[0].value, ['Apples: 50', 'Apples', '50']);
        });

        it('non-optional: throws if value does not match', async () => {
            await runtime.assertError('PlaybackError', async () => {
                await runtime.runPipes([
                    {
                        type: 'Value.getConstant',
                        value: 'Apples: foo',
                    },
                    {
                        type: 'String.extractRegexp',
                        regexp: '(\\w+): (\\d+)',
                        matchAll: false,
                    },
                ]);
            });
        });

        it('optional: discards if value does not match', async () => {
            const results = await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'Apples: foo',
                },
                {
                    type: 'String.extractRegexp',
                    regexp: '(\\w+): (\\d+)',
                    matchAll: false,
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });
    });

    context('match all', () => {
        it('extracts matching groups from all matches', async () => {
            const results = await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'Apples: 50, Bananas: 20',
                },
                {
                    type: 'String.extractRegexp',
                    regexp: '(\\w+): (\\d+)',
                    matchAll: true,
                },
            ]);
            assert.equal(results.length, 2);
            assert.equal(results[0].description, '#document');
            assert.deepEqual(results[0].value, ['Apples: 50', 'Apples', '50']);
            assert.deepEqual(results[1].value, ['Bananas: 20', 'Bananas', '20']);
        });

        it('non-optional: throws if value does not match', async () => {
            await runtime.assertError('PlaybackError', async () => {
                await runtime.runPipes([
                    {
                        type: 'Value.getConstant',
                        value: 'Apples: foo',
                    },
                    {
                        type: 'String.extractRegexp',
                        regexp: '(\\w+): (\\d+)',
                        matchAll: true,
                    },
                ]);
            });
        });

        it('optional: discards if value does not match', async () => {
            const results = await runtime.runPipes([
                {
                    type: 'Value.getConstant',
                    value: 'Apples: foo',
                },
                {
                    type: 'String.extractRegexp',
                    regexp: '(\\w+): (\\d+)',
                    matchAll: true,
                    optional: true,
                },
            ]);
            assert.equal(results.length, 0);
        });
    });
});
