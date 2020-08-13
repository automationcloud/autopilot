import { runtime } from '../../runtime';
import assert from 'assert';

describe('Page.input', () => {
    it('types text into element', async () => {
        await runtime.runActions([
            {
                type: 'Page.navigate',
                pipeline: {
                    pipes: [{ type: 'Value.getConstant', value: runtime.getUrl('/input.html') }],
                },
            },
            {
                type: 'Page.input',
                pipeline: {
                    pipes: [
                        { type: 'DOM.queryOne', selector: 'input' },
                        { type: 'Value.getConstant', value: 'Adélaïde' },
                    ],
                },
            },
        ]);
        const h1 = await runtime.page.querySelector('h1');
        const { text } = await h1!.getInfo();
        assert.equal(text, 'Your name is: Adélaïde');
    });
});
