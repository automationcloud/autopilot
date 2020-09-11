import { UserData } from '../userdata';
import { PropertyDecl, ConfigValue, Configuration } from '@automationcloud/engine';
import { controller } from '../controller';
import { injectable, inject } from 'inversify';
import { StorageController } from './storage';
import { EventBus } from '../event-bus';

export type SettingsEnv = 'staging' | 'production';

const DEFAULT_SETTINGS: Array<[string, string]> = [
    ['EXTENSIONS_DIR', StorageController.getFile('extensions')],
    ['AC_API_URL:staging', 'https://api-staging.automationcloud.net'],
    ['AC_API_URL:production', 'https://api.automationcloud.net'],
    ['ROXI_HOST:staging', 'proxy-staging.automationcloud.net:8001'],
    ['ROXI_HOST:production', 'proxy.automationcloud.net:8001'],
    ['PAYMENT_DELEGATE_URL:staging', 'https://payment-broker-staging.automationcloud.net/Payment/delegate'],
    ['PAYMENT_DELEGATE_URL:production', 'https://payment-broker.automationcloud.net/Payment/delegate'],
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
];

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
    }

    update() {
        this.userData.update({
            entries: this.entries,
            env: this.env,
        });
        this._applyConfigValues();
        this.events.emit('settingsUpdated');
    }

    setEnv(newEnv: SettingsEnv) {
        this.env = newEnv;
        this.update();
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
