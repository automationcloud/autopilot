import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/prepend', () => {
    it('prepends another set', async () => {
        await runtime.goto('/table.html');
        const results = await runtime.runPipes([
            { type: 'DOM.queryAll', selector: 'th' },
            {
                type: 'List.prepend',
                pipeline: {
                    pipes: [{ type: 'DOM.queryAll', selector: 'td' }],
                },
            },
        ]);
        assert.equal(results.length, 8);
        assert.deepEqual(
            results.map(_ => _.description),
            ['td', 'td', 'td', 'td', 'th', 'th', 'th', 'th'],
        );
    });
});
