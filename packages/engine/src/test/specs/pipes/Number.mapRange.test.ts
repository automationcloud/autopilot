import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: value/map-range', () => {
    it('maps numbers to specified ranges', async () => {
        const results = await runtime.runPipes([
            {
                type: 'Value.getJson',
                value: JSON.stringify([0, 1, 2, 17, 18]),
            },
            { type: 'List.fromArray' },
            {
                type: 'Number.mapRange',
                ranges: [
                    { value: 'infant', min: 0, max: 2 },
                    { value: 'child', min: 2, max: 18 },
                    { value: 'adult', min: 18, max: null },
                ],
            },
        ]);
        assert.equal(results.length, 5);
        assert.deepEqual(
            results.map(_ => _.value),
            ['infant', 'infant', 'child', 'child', 'adult'],
        );
    });
});
