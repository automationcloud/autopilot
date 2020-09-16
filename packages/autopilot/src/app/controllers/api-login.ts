import uuid from 'uuid';
import querystring from 'querystring';
import Ajv from 'ajv';
import { shell } from 'electron';
import { injectable, inject } from 'inversify';
import {
    ApiRequest,
    Request,
    OAuth2GrantType,
    OAuth2Agent,
    stringConfig,
    JsonSchema,
    Exception,
} from '@automationcloud/engine';
import { controller } from '../controller';
import { EventBus } from '../event-bus';
import { UserData } from '../userdata';
import { StorageController } from './storage';
import { SettingsController, SettingsEnv } from './settings';
import { httpServerPort } from '../globals';

const REDIRECT_URL = `http://localhost:${httpServerPort}/automationcloud/loginResult`;

const AC_LOGOUT_URL = stringConfig('AC_LOGOUT_URL', '');
const AC_ACCOUNT_URL = stringConfig('AC_ACCOUNT_URL', '');
const AC_AUTHORIZATION_URL = stringConfig('AC_AUTHORIZATION_URL', '');
const AC_ACCOUNT_INFO_URL = stringConfig('AC_ACCOUNT_INFO_URL', '');

const DEFAULT_TOKENS: TokensPerEnv = { staging: null, production: null };

const ajv = new Ajv();

@injectable()
@controller({ priority: 2000 })
export class ApiLoginController {
    protected userData: UserData;

    tokens: TokensPerEnv = { ...DEFAULT_TOKENS };
    account: AccountInfo | null = null;
    targetEnv: SettingsEnv | null = null;

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
        this.events.on('settingsUpdated', () => this.onSettingsUpdated());
    }

    async init() {
        this.tokens = await this.userData.loadData({ ...DEFAULT_TOKENS });
        this.initLogin();
    }

    update() {
        this.userData.update(this.tokens);
    }

    get refreshToken() {
        return this.tokens[this.settings.env];
    }

    get isAuthenticated() {
        return this.account != null;
    }

    get userInitial() {
        if (!this.account) {
            return 'U';
        }
        const { firstName, lastName, email } = this.account;
        const i1 = firstName[0] || null;
        const i2 = lastName[0] || null;
        return i1 && i2 ? i1 + i2 : email.substring(0, 2);
    }

    async logout() {
        this.invalidate();
        this.saveRefreshToken(null);
        // Send a logout request
        const baseUrl = this.settings.get(AC_LOGOUT_URL);
        const request = new Request({
            baseUrl,
            auth: this.api.authAgent,
        });
        await request.send('get', '');
        this.events.emit('apiAuthUpdated');
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
        this.saveRefreshToken(tokens.refreshToken);
        this.initLogin();
        this.events.emit('apiAuthUpdated');
    }

    protected getLoginUrl(): string {
        const state = this.storage.profileId;
        const nonce = uuid.v4();
        const { clientId } = this.api.authAgent.params;
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

    protected async authenticate() {
        try {
            this.loggingIn = true;
            this.account = await this.fetchAccountInfo();
            console.info('Signed in', this.account?.email);
        } catch (error) {
            console.warn('Sign in failed', { error });
            await this.logout().catch(() => { });
        } finally {
            this.loggingIn = false;
        }
    }

    protected initLogin() {
        this.targetEnv = this.settings.env;
        this.invalidate();
        const { refreshToken } = this;
        if (refreshToken) {
            this.api.authAgent.setTokens({ refreshToken });
            this.authenticate().catch(() => { });
        }
    }

    protected invalidate() {
        this.api.authAgent.invalidate();
        this.account = null;
    }

    protected saveRefreshToken(refreshToken: string | null) {
        this.tokens[this.settings.env] = refreshToken;
        this.update();
    }

    protected async onSettingsUpdated() {
        if (this.targetEnv === this.settings.env) {
            return;
        }
        this.initLogin();
        this.events.emit('apiAuthUpdated');
    }

    protected async waitForCode(timeout: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(onTimeout, timeout);
            const events = this.events;
            events.addListener('loginResult', onResult);

            // TODO add cancel button & flow?
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
        const { tokenUrl, clientId } = this.api.authAgent.params;
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

    protected async fetchAccountInfo(): Promise<AccountInfo> {
        const accountUrl = this.settings.get(AC_ACCOUNT_INFO_URL);
        const request = new Request({
            baseUrl: accountUrl,
            auth: this.api.authAgent,
        });
        const body = await request.get('');
        const valid = accountInfoValidator(body);
        if (!valid) {
            const messages = accountInfoValidator.errors?.map(_ => _.message ?? '').join('\n') || '';
            throw new Exception({
                name: 'AccountFetchFailed',
                message: `Account details invalid:\n\n${messages}`,
            });
        }
        return {
            email: body.email,
            emailVerified: body.email_verified ?? false,
            firstName: body.given_name ?? '',
            lastName: body.family_name ?? '',
            username: body.preferred_username ?? '',
            organisationId: body.organisationId ?? null,
            userId: body.userId ?? null,
        };
    }

}

interface TokensPerEnv {
    staging: string | null;
    production: string | null;
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

const accountInfoSchema: JsonSchema = {
    type: 'object',
    required: ['email'],
    properties: {
        'email': { type: 'string' },
        'email_verified': { type: 'boolean' },
        'given_name': { type: 'string' },
        'family_name': { type: 'string' },
        'preferred_username': { type: 'string' },
        'organisationId': { type: 'string' },
        'userId': { type: 'string' },
    }
};

const accountInfoValidator = ajv.compile(accountInfoSchema);
