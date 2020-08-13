import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/map-regexp', () => {
    it('maps strings to specified regexes', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify(['Visa', 'Visa Electron', 'MasterCard']),
            },
            { type: 'List.fromArray' },
            {
                type: 'String.mapRegexp',
                patterns: [
                    { value: 'vi', regexp: 'visa', flags: 'ig' },
                    { value: 'mc', regexp: 'MasterCard', flags: 'ig' },
                ],
            },
        ]);
        assert.equal(results.length, 3);
        assert.deepEqual(
            results.map(_ => _.value),
            ['vi', 'vi', 'mc'],
        );
    });
});
