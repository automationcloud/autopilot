import { runtime } from '../../runtime';
import assert from 'assert';

describe('Page.setCookies', () => {
    it('sets cookies', async () => {
        runtime.flow.inputs.push({
            key: 'cookies',
            data: [
                {
                    url: 'https://some-domain.com/',
                    name: 'a-name',
                    value: 'a-value',
                },
            ],
        });
        await runtime.runActions([
            {
                id: 'cookies',
                type: 'Page.setCookies',
                pipeline: [
                    { type: 'Value.getInput', inputKey: 'cookies' },
                ],
            },
        ]);
        const { cookies } = await runtime.page.send('Network.getAllCookies');
        const cookie = cookies.find((cookie: any) => cookie.name === 'a-name');
        assert.ok(cookie);
        assert.equal(cookie.name, 'a-name');
        assert.equal(cookie.value, 'a-value');
        assert.equal(cookie.domain, 'some-domain.com');
        assert.equal(cookie.path, '/');
    });
});
