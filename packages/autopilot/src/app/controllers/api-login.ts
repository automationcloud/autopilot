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

import uuid from 'uuid';
import querystring from 'querystring';
import Ajv from 'ajv';
import { remote, shell, ipcRenderer } from 'electron';
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
import { EventsController } from '../controllers/events';
import { StorageController } from './storage';
import { SettingsController } from './settings';
import { controlServerPort, profile } from '../globals';

const AC_LOGOUT_URL = stringConfig('AC_LOGOUT_URL', '');
const AC_ACCOUNT_URL = stringConfig('AC_ACCOUNT_URL', '');
const AC_AUTHORIZATION_URL = stringConfig('AC_AUTHORIZATION_URL', '');
const AC_ACCOUNT_INFO_URL = stringConfig('AC_ACCOUNT_INFO_URL', '');

const ajv = new Ajv();

@injectable()
@controller({ priority: 2000, alias: 'apiLogin' })
export class ApiLoginController {
    account: AccountInfo | null = null;

    constructor(
        @inject(EventsController)
        protected events: EventsController,
        @inject(StorageController)
        protected storage: StorageController,
        @inject(SettingsController)
        protected settings: SettingsController,
        @inject(ApiRequest)
        protected api: ApiRequest,
    ) {
        this.events.on('settingsUpdated', () => this.onSettingsUpdated());
        this.events.on('apiAuthInvalidated', () => this.onAuthInvalidated());
        ipcRenderer.on('acLoginResult', (_ev, code: string) => this.onAcLoginResult(code));
    }

    async init() {
        this.authenticate().catch(() => { });
    }

    updateRefreshToken(refreshToken: string) {
        this.settings.setValue('AC_API_REFRESH_TOKEN', refreshToken, true);
    }

    isAuthenticated(): boolean {
        return this.account != null && this.api.isAuthenticated();
    }

    get userInitial() {
        const { firstName = '', email = '' } = this.account || {};
        return firstName[0] ?? email[0] ?? 'U';
    }

    get accountFullName() {
        const { firstName, lastName, email } = this.account || {};
        return [firstName, lastName].filter(Boolean).join(' ') || email || '';
    }

    async logout() {
        // Send a logout request
        const baseUrl = this.settings.get(AC_LOGOUT_URL);
        const request = new Request({
            baseUrl,
            auth: this.api.authAgent,
        });
        await request.send('get', '');
        this.updateRefreshToken('');
        this.events.emit('apiAuthUpdated');
    }

    async manageAccount() {
        const url = this.settings.get(AC_ACCOUNT_URL);
        await shell.openExternal(url);
    }

    async startLogin() {
        try {
            const url = this.getLoginUrl();
            await shell.openExternal(url);
        } catch (error) {
            const msg = ['Login failed', error.message].filter(Boolean).join(': ');
            alert(msg);
            console.error(error);
        }
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
            'redirect_uri': this.getRedirectUrl(),
            'response_type': 'code',
        });
        const url = this.settings.get(AC_AUTHORIZATION_URL);
        return url + '?' + query;
    }

    protected getRedirectUrl() {
        return `http://localhost:${controlServerPort}/acLoginCallback?profileId=${profile.id}`;
    }

    protected async authenticate() {
        if (!this.api.isAuthenticated()) {
            return;
        }
        try {
            this.account = await this.fetchAccountInfo();
            console.info('Signed in', this.account?.email);
        } catch (error) {
            console.warn('Sign in failed', { error });
            await this.logout().catch(() => { });
        } finally {
        }
    }

    protected activateWindow() {
        const wnd = remote.getCurrentWindow();
        wnd.focus();
    }

    protected onSettingsUpdated() {
        this.init();
    }

    protected onAuthInvalidated() {
        this.updateRefreshToken('');
    }

    protected async onAcLoginResult(code: string) {
        try {
            const tokens = await this.exchangeToken(code);
            this.updateRefreshToken(tokens.refreshToken);
            this.events.emit('apiAuthUpdated');
            this.activateWindow();
        } catch (err) {
            console.warn('Log in failed', err);
        }
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
            'redirect_uri': this.getRedirectUrl(),
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
