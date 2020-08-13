import { runtime } from'../../runtime';
import assert from 'assert';

describe('Pipes: other/select-network-resources', () => {
    it('select-network-resources pipe', async () => {
        await runtime.goto('/network/ajax-seq.html');
        const result = await runtime.runPipes([
            {
                type: 'Browser.selectNetworkResources',
                hostnameRegexp: '(?<!\\/).*',
                pathnameRegexp: '.*',
            },
        ]);
        assert(result.length > 0);
        assert.equal(result.values().next().value.value.request.url, runtime.page.url());
    });
});
