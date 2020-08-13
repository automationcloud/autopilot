import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/append', () => {
    it('appends another set', async () => {
        await runtime.goto('/table.html');
        const results = await runtime.runPipes([
            { type: 'DOM.queryAll', selector: 'th' },
            {
                type: 'List.append',
                pipeline: {
                    pipes: [{ type: 'DOM.queryAll', selector: 'td' }],
                },
            },
        ]);
        assert.equal(results.length, 8);
        assert.deepEqual(
            results.map(_ => _.description),
            ['th', 'th', 'th', 'th', 'td', 'td', 'td', 'td'],
        );
    });
});
