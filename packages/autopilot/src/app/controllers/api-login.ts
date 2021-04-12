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

import {
    ApiRequest,
    Exception,
    JsonSchema,
    OAuth2Agent,
    OAuth2GrantType,
    Request,
    stringConfig,
} from '@automationcloud/engine';
import Ajv from 'ajv';
import { ipcRenderer, remote, shell } from 'electron';
import { inject, injectable } from 'inversify';
import querystring from 'querystring';
import uuid from 'uuid';

import { controller } from '../controller';
import { EventsController } from '../controllers/events';
import { controlServerPort, profile } from '../globals';
import { SettingsController } from './settings';
import { StorageController } from './storage';

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
        this.events.on('apiAuthError', () => this.invalidateTokens());
        this.events.on('tokenUpdated', () => this.onTokenUpdated());
        ipcRenderer.on('acLoginResult', (_ev, code: string) => this.onAcLoginResult(code));
    }

    async init() {
        // get accessToken before other api calls
        const accessToken = await this.api.authAgent.getHeader();
        console.debug(`[api-login] access token ${ accessToken ? 'obtained' : 'empty' }`);
    }

    updateRefreshToken(refreshToken: string) {
        this.settings.setValue('AC_API_REFRESH_TOKEN', refreshToken, true);
    }

    isAuthenticated(): boolean {
        return !!this.api.authAgent.params.refreshToken;
    }

    get userInitial() {
        const { firstName = '', email = '' } = this.account || {};
        return firstName[0] ?? email[0] ?? 'U';
    }

    get accountFullName() {
        const { firstName, lastName, email } = this.account || {};
        return [firstName, lastName].filter(Boolean).join(' ') || email || '';
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
            scope: 'offline_access',
            client_id: clientId,
            redirect_uri: this.getRedirectUrl(),
            response_type: 'code',
        });
        const url = this.settings.get(AC_AUTHORIZATION_URL);
        return url + '?' + query;
    }

    protected getRedirectUrl() {
        return `http://localhost:${controlServerPort}/acLoginCallback?profileId=${profile.id}`;
    }

    protected async onTokenUpdated() {
        // it's called when the api.authAgent.accessToken has changed
        if (!this.isAuthenticated()) {
            this.account = null;
            return;
        }
        // authenticate but account detail is not fetched
        if (!this.account) {
            this.account = await this.getAccountInfo();
        }
    }

    protected activateWindow() {
        const wnd = remote.getCurrentWindow();
        wnd.focus();
    }

    protected invalidateTokens() {
        this.api.authAgent.setTokens({});
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
            grant_type: OAuth2GrantType.AUTHORIZATION_CODE,
            client_id: clientId,
            redirect_uri: this.getRedirectUrl(),
            code,
        });
        return tokens;
    }

    protected async getAccountInfo(): Promise<AccountInfo | null> {
        const accountUrl = this.settings.get(AC_ACCOUNT_INFO_URL);
        const request = new Request({
            baseUrl: accountUrl,
            auth: this.api.authAgent,
            retryAttempts: 1,
        });
        try {
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
        } catch (err) {
            return null;
        }
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
        email: { type: 'string' },
        email_verified: { type: 'boolean' },
        given_name: { type: 'string' },
        family_name: { type: 'string' },
        preferred_username: { type: 'string' },
        organisationId: { type: 'string' },
        userId: { type: 'string' },
    }
};

const accountInfoValidator = ajv.compile(accountInfoSchema);
