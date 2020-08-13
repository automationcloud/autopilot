import { runtime } from '../../runtime';
import assert from 'assert';

describe('Page.inputFile', () => {
    it('uploads a file to server', async () => {
        await runtime.goto('/input-file.html');
        const script = createScript();
        await script.runAll();
        await new Promise(r => setTimeout(r, 300));
        await runtime.page.waitForLoad();
        const body = await runtime.page.querySelector('body');
        const { text } = await body!.getInfo();
        const data = JSON.parse(text);
        assert.ok(data.stat);
        assert.ok(data.file);
        assert.equal(data.text.trim(), 'Hello, World!');
        assert.equal(data.field, 'Hello');
    });
});

function createScript() {
    return runtime.createScriptWithActions([
        {
            type: 'Page.fetch',
            responseBodyFormat: 'blob',
            pipeline: {
                pipes: [
                    {
                        type: 'Value.getJson',
                        value: JSON.stringify({
                            method: 'get',
                            url: runtime.getUrl('/hello.txt'),
                        }),
                    },
                ],
            },
            children: [
                {
                    type: 'Page.inputFile',
                    pipeline: {
                        pipes: [
                            {
                                type: 'DOM.queryOne',
                                selector: 'input[type="file"]',
                            },
                            {
                                type: 'Object.getPath',
                                path: '/response/body',
                            },
                        ],
                    },
                },
            ],
        },
        {
            type: 'Page.input',
            pipeline: {
                pipes: [
                    {
                        type: 'DOM.queryOne',
                        selector: 'input[type="text"]',
                    },
                    {
                        type: 'Value.getJson',
                        value: JSON.stringify('Hello'),
                    },
                ],
            },
        },
        {
            type: 'Page.click',
            pipeline: {
                pipes: [
                    {
                        type: 'DOM.queryOne',
                        selector: 'button[type="submit"]',
                    },
                ],
            },
        },
    ]);
}
