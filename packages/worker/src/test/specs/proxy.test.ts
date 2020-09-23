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
