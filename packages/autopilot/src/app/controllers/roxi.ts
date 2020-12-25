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

import { ProxyConfig, ApiController } from './api';
import { injectable, inject } from 'inversify';
import { controller } from '../controller';
import { EventBus } from '../event-bus';
import { ProxyService, ApiRequest, Configuration, uniproxy } from '@automationcloud/engine';
import { UserData } from '../userdata';
import { StorageController } from './storage';
import { popupMenu } from '../util/menu';
import { MenuItemConstructorOptions } from 'electron';

export type ProxyConnectionType = 'direct' | 'proxy';

// TODO rename!
@injectable()
@controller({ backgroundInit: true })
export class RoxiController {
    userData: UserData;

    selectedTag: string = '';

    availableTags: string[] = [];
    proxyConfig: ProxyConfig | null = null;

    constructor(
        @inject(ProxyService)
        protected proxy: ProxyService,
        @inject(EventBus)
        protected events: EventBus,
        @inject(ApiController)
        protected api: ApiController,
        @inject(ApiRequest)
        protected apiRequest: ApiRequest,
        @inject(Configuration)
        protected config: Configuration,
        @inject(StorageController)
        protected storage: StorageController,
    ) {
        this.userData = storage.createUserData('roxi', 300);
        this.events.on('apiAuthUpdated', () => this.init());
    }

    async init() {
        const {
            selectedTag = '',
        } = await this.userData.loadData();
        this.selectedTag = selectedTag;
        await this.refreshAvailableTags();
        await this.configureProxy();
    }

    update() {
        this.userData.update({
            selectedTag: this.selectedTag,
        });
    }

    protected async configureProxy() {
        try {
            this.proxyConfig = null;
            this.proxy.clearRoutes();
            if (!this.isAuthenticated() || this.selectedTag === '') {
                return;
            }
            this.proxyConfig = await this.sampleProxy(this.selectedTag);
            if (!this.proxyConfig) {
                return;
            }
            const upstream = this.getProxyUpstreamConfig(this.proxyConfig);
            this.proxy.defaultUpstream = upstream;
            this.proxy.closeAllSockets();
        } catch (error) {
            console.warn('Could not configure proxy', { error });
            this.proxy.clearRoutes();
            this.proxy.closeAllSockets();
        }
    }

    protected async refreshAvailableTags() {
        this.availableTags = [];
        if (!this.isAuthenticated()) {
            return;
        }
        try {
            this.availableTags = await this.api.getDistinctTags();
        } catch (error) {
            console.warn('Could not fetch proxy tags', { error });
        }
    }

    async sampleProxy(tag: string): Promise<ProxyConfig | null> {
        if (!this.isAuthenticated()) {
            return null;
        }
        try {
            return await this.api.sample([tag]);
        } catch (error) {
            console.warn('Could not fetch proxy tags', { error });
            return null;
        }
    }

    isAuthenticated() {
        return this.apiRequest.isAuthenticated();
    }

    isActive() {
        return !!this.proxyConfig;
    }

    set(updates: {
        selectedTag?: string;
        useRoxi?: boolean;
        useRoxiCache?: boolean;
    }) {
        Object.assign(this, updates);
        this.update();
        this.configureProxy();
    }

    protected getProxyUpstreamConfig(proxyConfig: ProxyConfig): uniproxy.ProxyUpstream {
        return {
            useHttps: false,
            host: proxyConfig.connection.hostname + ':' + proxyConfig.connection.port,
            username: encodeURIComponent(proxyConfig.connection.username),
            password: encodeURIComponent(proxyConfig.connection.password),
        };
    }

    popupMenu() {
        const menuItems: MenuItemConstructorOptions[] = [
            {
                label: 'Connect directly',
                type: 'checkbox',
                checked: !this.isActive(),
                click: () => {
                    this.set({
                        selectedTag: ''
                    });
                }
            },
            { type: 'separator' }
        ];
        for (const tag of this.availableTags) {
            menuItems.push({
                label: tag,
                type: 'checkbox',
                checked: this.selectedTag === tag,
                click: () => {
                    this.set({
                        selectedTag: tag
                    });
                }
            });
        }
        popupMenu(menuItems);
    }
}
