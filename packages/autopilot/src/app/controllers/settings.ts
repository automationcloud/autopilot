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

import { UserData } from '../userdata';
import { PropertyDecl, ConfigValue, Configuration, getConfigDeclarations } from '@automationcloud/engine';
import { controller } from '../controller';
import { injectable, inject } from 'inversify';
import { StorageController } from './storage';
import { EventBus } from '../event-bus';

export type SettingsEnv = 'staging' | 'production';

const DEFAULT_SETTINGS: Array<[string, string]> = [
    ['EXTENSIONS_DIR', StorageController.getFile('extensions')],
    ['EMULATION_MODE', 'disabled'],
    ['AC_API_URL:staging', 'https://api-staging.automationcloud.net'],
    ['AC_API_URL:production', 'https://api.automationcloud.net'],
    ['AC_API_TOKEN_URL:staging', 'https://auth-staging.automationcloud.net/auth/realms/automationcloud/protocol/openid-connect/token'],
    ['AC_API_TOKEN_URL:production', 'https://auth.automationcloud.net/auth/realms/automationcloud/protocol/openid-connect/token'],
    ['AC_API_CLIENT_ID', 'autopilot'],
    /** only for Autopilot */
    ['AC_LOGOUT_URL:staging', 'https://auth-staging.automationcloud.net/auth/realms/automationcloud/protocol/openid-connect/logout'],
    ['AC_LOGOUT_URL:production', 'https://auth.automationcloud.net/auth/realms/automationcloud/protocol/openid-connect/logout'],
    ['AC_ACCOUNT_URL:staging', 'https://auth-staging.automationcloud.net/auth/realms/automationcloud/account'],
    ['AC_ACCOUNT_URL:production', 'https://auth.automationcloud.net/auth/realms/automationcloud/account'],
    ['AC_AUTHORIZATION_URL:staging', 'https://auth-staging.automationcloud.net/auth/realms/automationcloud/protocol/openid-connect/auth'],
    ['AC_AUTHORIZATION_URL:production', 'https://auth.automationcloud.net/auth/realms/automationcloud/protocol/openid-connect/auth'],
    ['AC_ACCOUNT_INFO_URL:staging', 'https://auth-staging.automationcloud.net/auth/realms/automationcloud/protocol/openid-connect/userinfo'],
    ['AC_ACCOUNT_INFO_URL:production', 'https://auth.automationcloud.net/auth/realms/automationcloud/protocol/openid-connect/userinfo'],
    ['ROXI_HOST:staging', 'proxy-staging.automationcloud.net:8001'],
    ['ROXI_HOST:production', 'proxy.automationcloud.net:8001']
];

const AC_LINKS: Map<string, string> = new Map([
    ['home', 'https://www.automationcloud.net/'],
    ['community', 'https://community.automationcloud.net/'],
    ['robotSchool', 'https://robotschool.dev'],
    ['dashboard', 'https://dashboard.automationcloud.net/'],
    ['register', 'https://www.automationcloud.net/pricing']
]);

@injectable()
@controller({ priority: 5000 })
export class SettingsController {
    userData: UserData;

    env: SettingsEnv = 'production';
    entries: Array<[string, string]> = [];

    constructor(
        @inject(StorageController)
        storage: StorageController,
        @inject(EventBus)
        protected events: EventBus,
        @inject(Configuration)
        protected config: Configuration,
    ) {
        this.userData = storage.createUserData('settings', 500);
    }

    async init() {
        const { entries = [], env = 'production' } = await this.userData.loadData();
        this.entries = [];
        this._addEntries(entries);
        this.env = env;
        this._applyConfigValues();
        this.events.emit('settingsReady');
    }

    update() {
        this.userData.update({
            entries: this.entries,
            env: this.env,
        });
        this._applyConfigValues();
        this.events.emit('settingsUpdated');
    }

    switchToStaging() { this.setEnv('staging'); }

    switchToProduction() { this.setEnv('production'); }

    protected async setEnv(env: SettingsEnv) {
        if (env !== this.env) {
            console.info(`👾 Switching to ${env}...`);
            this.env = env;
            this.update();
        }
        console.info('You are on ' + this.env);
    }

    get<T extends ConfigValue>(decl: PropertyDecl<T>): T {
        return this.config.get(decl);
    }

    set<T extends ConfigValue>(decl: PropertyDecl<T>, value: T) {
        this._setSingleValue(decl.key, String(value));
        this.update();
    }

    setEntries(entries: Array<[string, string | null]>) {
        this._addEntries(entries);
        this.update();
    }

    *allEntries(): IterableIterator<[string, string]> {
        yield* DEFAULT_SETTINGS;
        yield* this.entries;
    }

    // TODO this is unused, so kill it if necessary
    getAllEntries(): SettingsEntry[] {
        const results: SettingsEntry[] = [];
        const map: Map<string, string> = new Map(this.entries);
        for (const [key, decl] of getConfigDeclarations().entries()) {
            const values = [
                { env: '', value: map.get(key) },
                { env: 'staging', value: map.get(key + ':staging') },
                { env: 'production', value: map.get(key + ':production') },
            ].filter(_ => _.value != null) as SettingsEntryValue[];
            const entry = { decl, values };
            results.push(entry);
        }
        return results.sort((a, b) => (a.decl.key > b.decl.key ? 1 : -1));
    }

    getValue(key: string): any {
        const decl = getConfigDeclarations().get(key);
        return decl ? this.config.get(decl) : null;
    }

    setValue(key: string, value: string | null, useEnv: boolean = false) {
        const _key = useEnv ? `${key}:${this.env}` : key;
        this._setSingleValue(_key, value);
        this.update();
    }

    getAcLink(key: string): string {
        return AC_LINKS.get(key) ?? '';
    }

    protected _addEntries(entries: Array<[string, string | null]>) {
        for (const [k, v] of entries) {
            this._setSingleValue(k, v);
        }
    }

    protected _setSingleValue(key: string, value: string | null) {
        const i = this.entries.findIndex(_ => _[0] === key);
        if (i > -1) {
            this.entries.splice(i, 1);
        }
        if (value != null) {
            this.entries.push([key, String(value)]);
        }
    }

    protected _applyConfigValues() {
        const config = this.config;
        // Note: we replace the whole map, so that it remains Vue-observable
        config.values = new Map();
        for (const [k, v] of this.allEntries()) {
            if (k.includes(':')) {
                // handle env-specific keys, i.e. '<env>:PROPERTY_KEY'
                const [key, env] = k.split(':');
                if (env === this.env) {
                    config.values.set(key, v);
                }
            } else {
                config.values.set(k, v);
            }
        }
    }

}

export interface SettingsEntry {
    decl: PropertyDecl<any>;
    values: SettingsEntryValue[];
}

export interface SettingsEntryValue {
    env: string;
    value: string;
}
