import { runtime } from '../runtime';
import assert from 'assert';
import { ProxyService } from '@automationcloud/engine';

describe('Proxy', () => {
    beforeEach(async () => {
        await runtime.helpers.runNewExecution({
            id: 'happy',
            serviceId: 'happy',
            ip: 'someOtherRoxiIp',
            proxyId: 'someRoxiIpAddressId',
            options: {
                useRoxiCache: true,
            },
            input: {
                account: {
                    name: 'Jane Norman',
                },
            },
        });
    });

    it('sets roxi route', async () => {
        const route = await runtime.helpers.getProxyRoute('someRoxiIpAddressId');
        const proxy = runtime.app.container.get(ProxyService);
        const [proxyRoute] = proxy.getSerializedRoutes();
        assert.ok(proxyRoute.upstream);
        const decoded = JSON.parse(decodeURIComponent(proxyRoute.upstream?.username || ''));
        assert.equal(decoded.hostname, route.connection.hostname);
        assert.equal(decoded.port, route.connection.port);
        assert.equal(decoded.username, route.connection.username);
        assert.equal(decoded.password, route.connection.password);
        assert.equal(decoded.authScheme, route.connection.authScheme);
        assert.equal(decoded.cache, true);
        assert.equal(decoded.partition, 'happy');
    });
});
