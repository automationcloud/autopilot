import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: dom/get-document', () => {
    it('overrides element with #document', async () => {
        await runtime.goto('/buttons.html');
        const results = await runtime.runPipes([
            {
                type: 'DOM.queryAll',
                selector: 'button',
            },
            { type: 'DOM.getText' },
            { type: 'DOM.document' },
        ]);
        assert.equal(results.length, 4);
        for (const el of results) {
            assert.equal(el.description, '#document');
        }
        assert.equal(results.map(_ => _.value).join(','), 'English,Français,Português,Español');
    });
});
