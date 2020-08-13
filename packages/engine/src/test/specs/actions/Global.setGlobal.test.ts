import { runtime } from '../../runtime';
import assert from 'assert';

describe('Global.setGlobal', () => {
    it('sets global variable', async () => {
        await runtime.goto('/input.html');
        const script = await runtime.createScriptWithActions([
            {
                id: 'set-global',
                type: 'Global.setGlobal',
                key: 'hi',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify({ hello: 'hello world' }),
                        },
                    ],
                },
            },
            {
                id: 'input',
                type: 'Page.input',
                pipeline: {
                    pipes: [
                        {
                            type: 'DOM.queryOne',
                            selector: 'input',
                        },
                        {
                            type: 'Value.getGlobal',
                            key: 'hi',
                        },
                        {
                            type: 'Object.getPath',
                            path: '/hello',
                        },
                    ],
                },
            },
        ]);
        await script.runAll();
        assert.equal(runtime.$globals.values.length, 1);
        assert.equal(runtime.$globals.values[0].key, 'hi');
        assert.deepEqual(runtime.$globals.values[0].value, { hello: 'hello world' });
        const input = await runtime.page.querySelector('input');
        const { value } = await input!.getInfo();
        assert.equal(value, 'hello world');
    });
});
