// Copyright 2020 Ubio Limited
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

import { ProxyConfig, ApiController } from './api';
import { injectable, inject } from 'inversify';
import { controller } from '../controller';
import { EventBus } from '../event-bus';
import { SettingsController } from './settings';
import {
    stringConfig,
    booleanConfig,
    ProxyService
} from '@automationcloud/engine';
import { debounce } from 'debounce';

const ROXI_ENABLED = booleanConfig('ROXI_ENABLED', false);
const ROXI_HOST = stringConfig('ROXI_HOST', 'proxy.automationcloud.net:8001');
const ROXI_SECRET = stringConfig('ROXI_SECRET', '');
const ROXI_TAGS = stringConfig('ROXI_TAGS', 'gb');
const ROXI_CACHE = booleanConfig('ROXI_CACHE', false);
const ROXI_PARTITION = stringConfig('ROXI_PARTITION', 'Autopilot');

@injectable()
@controller({ backgroundInit: true })
export class RoxiController {
    tags: string[] = [];
    proxyConfig: ProxyConfig | null = null;

    constructor(
        @inject(ProxyService)
        protected proxy: ProxyService,
        @inject(EventBus)
        protected events: EventBus,
        @inject(ApiController)
        protected api: ApiController,
        @inject(SettingsController)
        protected settings: SettingsController,
    ) {
        const onInit = debounce(this.init.bind(this), 500);
        this.events.on('apiAuthUpdated', onInit);
    }

    async init() {
        const proxy = this.proxy;
        proxy.clearRoutes();
        if (!this.isEnabled()) {
            return;
        }
        this.tags = await this.fetchTags();
        this.proxyConfig = await this.fetchSampleProxy(this.getSelectedTag());
        if (this.proxyConfig != null) {
            proxy.addRoute(/.*/, {
                host: this.getRoxiHost(),
                username: encodeURIComponent(
                    JSON.stringify({
                        ...this.proxyConfig.connection,
                        cache: this.isUseCache(),
                        partition: this.getPartition(),
                    }),
                ),
                password: this.getRoxiSecret(),
            });
        }
    }

    async fetchTags(): Promise<string[]> {
        try {
            const res = await this.api.getDistinctTags();
            return res;
        } catch (err) {
            return [];
        }
    }

    async fetchSampleProxy(tag: string): Promise<ProxyConfig | null> {
        try {
            return await this.api.sample([tag]);
        } catch (error) {
            return null;
        }
    }

    isSecretConfigured() {
        return !!this.getRoxiSecret();
    }

    isEnabled() {
        return this.isSecretConfigured() && this.settings.get(ROXI_ENABLED);
    }

    setEnabled(enabled: boolean) {
        this.settings.set(ROXI_ENABLED, enabled);
    }

    getSelectedTag() {
        return this.settings.get(ROXI_TAGS).split(',')[0];
    }

    toggleTag(tag: string) {
        this.settings.set(ROXI_TAGS, tag);
    }

    isUseCache() {
        return this.settings.get(ROXI_CACHE);
    }

    setUseCache(useCache: boolean) {
        this.settings.set(ROXI_CACHE, useCache);
    }

    getPartition() {
        return this.settings.get(ROXI_PARTITION);
    }

    setPartition(partition: string) {
        this.settings.set(ROXI_PARTITION, partition);
    }

    getRoxiHost() {
        return this.settings.get(ROXI_HOST);
    }

    getRoxiSecret() {
        return this.settings.get(ROXI_SECRET);
    }

    isSampleProxyFound() {
        return !!this.proxyConfig;
    }

    // For debugging
    connectDirectly() {
        const proxy = this.proxy;
        const { proxyConfig } = this;
        if (!proxyConfig) {
            alert('No proxy configuration available');
            return;
        }
        proxy.clearRoutes();
        proxy.addRoute(/.*/, {
            useHttps: false,
            host: proxyConfig.connection.hostname + ':' + proxyConfig.connection.port,
            username: encodeURIComponent(proxyConfig.connection.username),
            password: encodeURIComponent(proxyConfig.connection.password),
        });
        proxy.closeAllSockets();
    }
}
