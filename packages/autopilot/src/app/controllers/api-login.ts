import uuid from 'uuid';
import querystring from 'querystring';
import assert from 'assert';
import { shell } from 'electron';
import { injectable, inject } from 'inversify';
import {
    ApiRequest,
    Request,
    OAuth2GrantType,
    stringConfig,
} from '@automationcloud/engine';
import { controller } from '../controller';
import { EventBus } from '../event-bus';
import { UserData } from '../userdata';
import { StorageController } from './storage';
import { SettingsController } from './settings';
import { httpServerPort } from '../globals';

const AC_LOGOUT_URL = stringConfig('AC_LOGOUT_URL', '');
const AC_ACCOUNT_URL = stringConfig('AC_ACCOUNT_URL', '');
const AC_AUTHORIZATION_URL = stringConfig('AC_AUTHORIZATION_URL', '');
const AC_ACCOUNT_INFO_URL = stringConfig('AC_ACCOUNT_INFO_URL', '');

@injectable()
@controller({ priority: 2000 }) // ExtensionRegistry depends on it
export class ApiLoginController {
    userData: UserData;
    account: AccountInfo | null = null;

    initialized: boolean = false;
    loggingIn: boolean = false;
    protected currentEnv: 'production' | 'staging' = 'production';

    constructor(
        @inject(EventBus)
        protected events: EventBus,
        @inject(StorageController)
        protected storage: StorageController,
        @inject(SettingsController)
        protected settings: SettingsController,
        @inject(ApiRequest)
        protected api: ApiRequest,
    ) {
        this.userData = this.storage.createUserData('auth', 500);
    }

    get authAgent() { return this.api.authAgent; }
    get authorised() { return this.authAgent.params.accessToken && this.account; }

    async init() {
        this.currentEnv = this.settings.env;
        this.invalidateAuthAgent();
        this.events.on('settingsUpdated', () => {
            if (this.settings.env !== this.currentEnv) {
                this.currentEnv = this.settings.env;
                this.onSwitchEnv();
            }
        });

        this.events.on('initialized', () => {
            // by the time this apiLogin.init is run, settings.clientId is still not applied,
            // so fetchAccountInfo fails if we call it from retrieveRefreshToken in L:59
            if (this.authAgent.params.accessToken) {
                this.fetchAccountInfo();
            }
        });

        this.retrieveRefreshToken();
    }

    invalidateAuthAgent() {
        this.authAgent.setTokens({
            accessToken: undefined,
            accessExpiresIn: undefined,
            refreshToken: undefined,
        });
    }

    async onSwitchEnv() {
        // cleanup previous auth state
        this.invalidateAuthAgent();
        this.loggingIn = true;
        this.account = null;
        this.events.emit('acApiAuthorised', false);
        try {
            await this.retrieveRefreshToken();
            await this.fetchAccountInfo();
            this.events.emit('acApiAuthorised', true);
        } catch (error) {
            console.warn('failed to authorise user when switching env', { error });
        }
        this.loggingIn = false;
    }

    async retrieveRefreshToken() {
        const tokens = await this.userData.loadData();
        const refreshToken = tokens[this.currentEnv] || null;
        if (refreshToken) {
            this.authAgent.setTokens({ refreshToken });
        }
    }

    async logout() {
        const baseUrl = this.settings.get(AC_LOGOUT_URL);
        const request = new Request({
            baseUrl,
            auth: this.authAgent,
        });

        await request.send('get', '/');
        this.onTokenInvalidated();
    }

    async manageAccount() {
        const url = this.settings.get(AC_ACCOUNT_URL);
        await shell.openExternal(url);
    }

    async startLogin(timeout?: number) {
        if (this.loggingIn) {
            return;
        }
        try {
            this.loggingIn = true;
            await this.login(timeout);
        } catch (error) {
            alert(error.message);
            console.error(error);
        } finally {
            this.loggingIn = false;
        }
    }

    getLoginUrl(): string {
        const state = this.storage.profileId;
        const nonce = uuid.v4();
        const query = querystring.stringify({
            state,
            nonce,
            scope: 'openid',
            'client_id': this.api.clientId,
            'redirect_uri': this.getRedirectUrl(),
            'response_type': 'code',
        });
        const url = this.settings.get(AC_AUTHORIZATION_URL);
        return url + '?' + query;
    }

    getRedirectUrl() {
        return `http://localhost:${httpServerPort}/automationcloud/loginResult`;
    }

    protected async login(timeout: number = 30000) {
        const url = this.getLoginUrl();
        await shell.openExternal(url);
        const code = await this.waitForCode(timeout);
        const tokens = await this.authAgent.createToken({
            'grant_type': OAuth2GrantType.AUTHORIZATION_CODE,
            'client_id': this.api.clientId,
            code,
            'redirect_uri': this.getRedirectUrl(),
        });

        this.authAgent.setTokens(tokens);
        await this.afterLogIn(tokens.refreshToken);
    }

    protected async waitForCode(timeout: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(onTimeout, timeout);
            const events = this.events;

            events.addListener('loginResult', onResult);

            // add cancel button & flow?
            function onResult(code: string) {
                cleanup();
                if (!code) {
                    return reject(new Error('Sign in failed, please try again'));
                }
                resolve(code);
            }

            function onTimeout() {
                cleanup();
                reject(new Error('Sign-in timeout, please try again'));
            }

            function cleanup() {
                clearTimeout(timer);
                events.removeListener('loginResult', onResult);
            }
        });

    }

    protected async afterLogIn(refreshToken: string) {
        try {
            await this.fetchAccountInfo();
            this.saveRefreshToken(refreshToken);
        } catch (error) {
            console.warn('failed to fetch User');
        }
    }

    protected async fetchAccountInfo() {
        const baseUrl = this.settings.get(AC_ACCOUNT_INFO_URL);
        const request = new Request({
            baseUrl,
            auth: this.authAgent,
            statusCodesToRetry: [[400, 401]],
            retryDelay: 500,
        });

        const res = await request.get('/');
        this.account = decodeAccountInfoResponse(res);
        this.events.emit('acApiAuthorised', true);
    }

    protected async saveRefreshToken(refreshToken: string | null) {
        const tokens = await this.userData.loadData();
        tokens[this.currentEnv] = refreshToken;

        this.userData.update(tokens);
    }

    async onTokenInvalidated() {
        this.invalidateAuthAgent();
        this.account = null;
        this.saveRefreshToken(null);
        this.events.emit('acApiAuthorised', false);
    }
}

interface AccountInfo {
    email: string;
    emailVerified: boolean;
    firstName: string;
    lastName: string;
    username: string;
    organisationId: string | null;
    userId: string | null;
}

function decodeAccountInfoResponse(res: { [key: string]: any }): AccountInfo {
    assertPropertyType(res, 'email', 'string');
    return {
        email: res.email,
        emailVerified: res.email_verified || false,
        firstName: res.given_name || '',
        lastName: res.family_name || '',
        username: res.preferred_username || '',
        organisationId: res.organisationId || null,
        userId: res.userId || null,
    };
}

function assertPropertyType(obj: { [key: string]: any }, propertyName: string, type: string, optional: boolean = false) {
    const val = obj[propertyName];
    if (val == null && optional) {
        return;
    }

    const actualType = typeof val;
    assert(actualType === type, `expected ${propertyName} to be ${type}, but got ${actualType}`);
}
