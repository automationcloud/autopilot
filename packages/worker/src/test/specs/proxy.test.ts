// Copyright 2020 UBIO Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

    it('sets default proxy route', async () => {
        const route = await runtime.helpers.getProxyRoute('someRoxiIpAddressId');
        const proxy = runtime.app.container.get(ProxyService);
        const [proxyRoute] = proxy.getRoutes();
        assert.ok(proxyRoute.upstream);
        assert.strictEqual(proxyRoute.upstream?.host, route.hostname + ':' + route.port);
        assert.strictEqual(proxyRoute.upstream?.username, route.username);
        assert.strictEqual(proxyRoute.upstream?.password, route.password);
    });

    it('(legacy) sets roxi route', async () => {
        const route = await runtime.helpers.getProxyRoute('someRoxiIpAddressId');
        const proxy = runtime.app.container.get(ProxyService);
        const [proxyRoute] = proxy.getRoutes();
        assert.ok(proxyRoute.upstream);
        const decoded = JSON.parse(decodeURIComponent(proxyRoute.upstream?.username || ''));
        assert.strictEqual(decoded.hostname, route.hostname);
        assert.strictEqual(decoded.port, route.port);
        assert.strictEqual(decoded.username, route.username);
        assert.strictEqual(decoded.password, route.password);
        assert.strictEqual(decoded.authScheme, route.authScheme);
        assert.strictEqual(decoded.cache, true);
        assert.strictEqual(decoded.partition, 'happy');
    });
});
