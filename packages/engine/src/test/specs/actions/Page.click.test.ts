import { runtime } from '../../runtime';
import assert from 'assert';

describe('Page.click', () => {
    it('clicks element', async () => {
        await runtime.runActions([
            {
                type: 'Page.navigate',
                pipeline: {
                    pipes: [{ type: 'Value.getConstant', value: runtime.getUrl('/click.html') }],
                },
            },
            {
                type: 'Page.click',
                pipeline: {
                    pipes: [{ type: 'DOM.queryOne', selector: 'button' }],
                },
            },
        ]);
        const submitted = await runtime.page.querySelector('.submitted');
        assert(submitted != null);
    });

    it('clicks element obscured by overlay', async () => {
        await runtime.runActions([
            {
                type: 'Page.navigate',
                pipeline: {
                    pipes: [{ type: 'Value.getConstant', value: runtime.getUrl('/click-overlay.html') }],
                },
            },
            {
                type: 'Page.click',
                pipeline: {
                    pipes: [{ type: 'DOM.queryOne', selector: 'button' }],
                },
            },
        ]);
        const submitted = await runtime.page.querySelector('.submitted');
        const { text } = await submitted!.getInfo();
        assert.equal(text, 'Submitted');
    });

    it('throws if element is not visible', async () => {
        await runtime.assertError('ElementNotVisible', async () => {
            await runtime.runActions([
                {
                    type: 'Page.navigate',
                    pipeline: {
                        pipes: [{ type: 'Value.getConstant', value: runtime.getUrl('/invisible.html') }],
                    },
                },
                {
                    type: 'Page.click',
                    pipeline: {
                        pipes: [{ type: 'DOM.queryOne', selector: 'a.invisible' }],
                    },
                },
            ]);
        });
    });

    it('clicks options', async () => {
        await runtime.runActions([
            {
                type: 'Page.navigate',
                pipeline: {
                    pipes: [{ type: 'Value.getConstant', value: runtime.getUrl('/select.html') }],
                },
            },
            {
                type: 'Page.click',
                pipeline: {
                    pipes: [{ type: 'DOM.queryOne', selector: 'option:nth-child(2)' }],
                },
            },
        ]);
        const h1 = await runtime.page.querySelector('h1');
        const { text } = await h1!.getInfo();
        assert.equal(text, 'Your language is: Français');
    });
});
