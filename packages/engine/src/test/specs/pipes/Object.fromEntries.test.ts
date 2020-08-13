import { runtime } from '../../runtime';
import assert from 'assert';

describe('Object.fromEntries', () => {
    it('returns an object collected from entries', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify([
                    { key: 'foo', value: 1 },
                    { key: 'bar', value: 3 },
                ]),
            },
            { type: 'List.fromArray' },
            {
                type: 'Object.fromEntries',
                keyPath: '/key',
                valuePath: '/value',
            },
        ]);
        assert.equal(results.length, 1);
        assert.equal(results[0].description, '#document');
        assert.deepEqual(results[0].value, { foo: 1, bar: 3 });
    });

    context('onMissingKey: error', () => {
        it('throws error if key not found', async () => {
            await runtime.assertError('PlaybackError', () =>
                runtime.runPipes([
                    {
                        type: 'Value.getJson',
                        value: JSON.stringify([
                            { key: 'foo', value: 1 },
                            { key1: 'bar', value: 3 },
                        ]),
                    },
                    { type: 'List.fromArray' },
                    {
                        type: 'Object.fromEntries',
                        keyPath: '/key',
                        valuePath: '/value',
                        onMissingKey: 'error',
                    },
                ]));
        });
    });

    context('onMissingValue: error', () => {
        it('throws error if value not found', async () => {
            await runtime.assertError('PlaybackError', () =>
                runtime.runPipes([
                    {
                        type: 'Value.getJson',
                        value: JSON.stringify([
                            { key: 'foo', value: 1 },
                            { key: 'bar', value1: 3 },
                        ]),
                    },
                    { type: 'List.fromArray' },
                    {
                        type: 'Object.fromEntries',
                        keyPath: '/key',
                        valuePath: '/value',
                        onMissingValue: 'error',
                    },
                ]));
        });
    });
});
