import uuid from 'uuid';
import querystring from 'querystring';
import assert from 'assert';
import { shell } from 'electron';
import { injectable, inject } from 'inversify';
import {
    ApiRequest,
    Request,
    OAuth2GrantType,
    OAuth2Agent,
    stringConfig,
} from '@automationcloud/engine';
import { controller } from '../controller';
import { EventBus } from '../event-bus';
import { UserData } from '../userdata';
import { StorageController } from './storage';
import { SettingsController } from './settings';
import { httpServerPort } from '../globals';
const REDIRECT_URL = `http://localhost:${httpServerPort}/automationcloud/loginResult`;

const AC_LOGOUT_URL = stringConfig('AC_LOGOUT_URL', '');
const AC_ACCOUNT_URL = stringConfig('AC_ACCOUNT_URL', '');
const AC_AUTHORIZATION_URL = stringConfig('AC_AUTHORIZATION_URL', '');
const AC_ACCOUNT_INFO_URL = stringConfig('AC_ACCOUNT_INFO_URL', '');

@injectable()
@controller({ priority: 2000 }) // ExtensionRegistry depends on it
export class ApiLoginController {
    protected userData: UserData;
    protected account: AccountInfo | null = null;

    initialized: boolean = false;
    loggingIn: boolean = false;

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
    get authorised() { return this.authAgent.params.accessToken; }
    get userInitial() {
        if (!this.account) {
            return 'U';
        }

        const { firstName, lastName, email } = this.account;
        const i1 = firstName[0] || null;
        const i2 = lastName[0] || null;

        return i1 && i2 ? i1 + i2 : email.substring(0, 2);
    }

    async init() {
        await this.silentLogin();
    }

    async silentLogin() {
        this.invalidate();
        this.loggingIn = true;
        try {
            const tokens = await this.userData.loadData();
            const refreshToken = tokens[this.settings.env] || null;
            if (refreshToken) {
                this.authAgent.setTokens({ refreshToken });
                await this.setAccountInfo();
                console.info('signed in: ' + this.account?.email);
            }
        } catch (error) {
            console.info('not signed in:', { error });
        }

        this.loggingIn = false;
    }


    protected invalidate() {
        this.authAgent.invalidate();
        this.account = null;
    }

    async logout() {
        const baseUrl = this.settings.get(AC_LOGOUT_URL);
        const request = new Request({
            baseUrl,
            auth: this.authAgent,
        });

        await request.send('get', '/');
        this.invalidate();
        this.saveRefreshToken(null);
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

    protected async login(timeout: number = 30000) {
        const url = this.getLoginUrl();
        await shell.openExternal(url);
        const code = await this.waitForCode(timeout);

        const tokens = await this.exchangeToken(code);
        this.authAgent.setTokens(tokens);
        if (tokens.refreshToken) {
            this.saveRefreshToken(tokens.refreshToken);
            await this.setAccountInfo();
            console.info('signed in: ' + this.account?.email);
        }
    }

    protected getLoginUrl(): string {
        const state = this.storage.profileId;
        const nonce = uuid.v4();
        const { clientId } = this.api;
        const query = querystring.stringify({
            state,
            nonce,
            scope: 'openid',
            'client_id': clientId,
            'redirect_uri': REDIRECT_URL,
            'response_type': 'code',
        });
        const url = this.settings.get(AC_AUTHORIZATION_URL);
        return url + '?' + query;
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
                reject(new Error('Sign in timeout, please try again'));
            }

            function cleanup() {
                clearTimeout(timer);
                events.removeListener('loginResult', onResult);
            }
        });

    }

    protected async exchangeToken(code: string) {
        const { tokenUrl, clientId } = this.api;
        const oauth2 = new OAuth2Agent({
            tokenUrl,
            clientId,
        });

        const tokens = await oauth2.createToken({
            'grant_type': OAuth2GrantType.AUTHORIZATION_CODE,
            'client_id': clientId,
            'redirect_uri': REDIRECT_URL,
            code,
        });

        return tokens;
    }

    protected async setAccountInfo() {
        const request = new Request({
            auth: this.authAgent,
            statusCodesToRetry: [[400, 401]],
            retryDelay: 500,
            retryAttempts: 4,
        });

        const accountUrl = this.settings.get(AC_ACCOUNT_INFO_URL);
        const res = await request.get(accountUrl);
        this.account = decodeAccountInfoResponse(res);
    }

    protected async saveRefreshToken(refreshToken: string | null) {
        const tokens = await this.userData.loadData();
        tokens[this.settings.env] = refreshToken;

        this.userData.update(tokens);
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
