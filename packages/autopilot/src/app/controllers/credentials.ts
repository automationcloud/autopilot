import {
    Action,
    ApiRequest,
    CredentialsConfig,
    CredentialsData,
    CredentialsOAuth1Data,
    CredentialsOAuth2Data,
    HttpCallbackService,
    model,
    OAuth1SignatureMethod,
    Pipe,
    StoredCredentials,
} from '@automationcloud/engine';
import { inject, injectable } from 'inversify';

import { controller } from '../controller';
import { ModalsController } from './modals';
import { NotificationsController } from './notifications';

const SSO_SERVICE_URL = 'https://connectors.automation.cloud/';

@injectable()
@controller({
    alias: 'credentials',
})
export class CredentialsController {
    // We'll write the credentials here
    item: Action | Pipe | null = null;
    param: model.ParamSpec | null = null;
    // These are available in our lists
    availableCredentials: StoredCredentials[] = [];
    lastSelected: StoredCredentials | null = null;

    constructor(
        @inject(ModalsController)
        protected modals: ModalsController,
        @inject(ApiRequest)
        protected apiRequest: ApiRequest,
        @inject(NotificationsController)
        protected notifications: NotificationsController,
        @inject(HttpCallbackService)
        protected httpCallback: HttpCallbackService,
    ) {
    }

    async init() {
        await this.fetchAvailableCredentials();
    }

    /**
     * Refreshes the list of available credentials
     * (on startup and when credentials change).
     */
    async fetchAvailableCredentials() {
        const { entities } = await this.apiRequest.get('/Credentials/listCredentials');
        this.availableCredentials = entities;
    }

    /**
     * Invoked by pressing "New login" button in Credentials parameter.
     */
    async showLoginDialog(item: Action | Pipe, param: model.ParamSpec) {
        if (param.type !== 'credentials') {
            return;
        }
        this.item = item;
        this.param = param;
        this.modals.show('create-credentials');
    }

    /**
     * Invoked when Log Out button is pressed, prompts to remove the credentials
     * from Credentials Store.
     */
    async logout(item: Action | Pipe, param: model.ParamSpec) {
        const creds = (item as any)[param.name];
        if (!(param.type === 'credentials' && creds.id)) {
            return;
        }
        this.notifications.removeById('credentials');
        this.notifications.add({
            id: 'credentials',
            level: 'warn',
            title: 'Confirm removing the credentials',
            message: `You are about to remove the credentials on ${param.providerName}. ` +
                'Automations using these credentials will stop working.',
            primaryAction: {
                title: 'Remove credentials',
                action: async () => {
                    await this.deleteCredentials(creds.id);
                    (item as any)[param.name] = null;
                    this.notifications.removeById('credentials');
                },
            },
            secondaryAction: {
                title: 'Cancel',
                action: () => {
                    this.notifications.removeById('credentials');
                }
            }
        });
    }

    /**
     * Invoked when Log In button is pressed in "New Login" dialog.
     */
    async login(spec: CreateCredentialsSpec) {
        if (!this.param) {
            // OR throw?
            return;
        }
        const { config } = spec;
        switch (config.type) {
            case 'oauth1': {
                const data = spec.data as CredentialsOAuth1Data;
                if (!config.customConfig) {
                    data.requestTokenUrl = config.requestTokenUrl;
                    data.accessTokenUrl = config.accessTokenUrl;
                    data.userAuthorizationUrl = config.userAuthorizationUrl;
                    data.signatureMethod = config.signatureMethod ?? OAuth1SignatureMethod.HMAC_SHA1;
                }
                const url = new URL('/v1/oauth', SSO_SERVICE_URL);
                url.searchParams.set('requestTokenURL', data.requestTokenUrl);
                url.searchParams.set('accessTokenURL', data.accessTokenUrl);
                url.searchParams.set('userAuthorizationURL', data.userAuthorizationUrl);
                url.searchParams.set('consumerKey', data.consumerKey);
                url.searchParams.set('consumerSecret', data.consumerSecret);
                url.searchParams.set('redirectURL', this.httpCallback.getCallbackUrl());
                const res = await this.httpCallback.open(url);
                const { token, tokenSecret } = res?.query ?? {};
                data.tokenKey = token;
                data.tokenSecret = tokenSecret;
                await this.saveCredentials(spec, this.param);
                return;
            }
            case 'oauth2': {
                const data = spec.data as CredentialsOAuth2Data;
                if (!config.customConfig) {
                    data.authorizationUrl = config.authorizationUrl;
                    data.tokenUrl = config.tokenUrl;
                }
                const url = new URL('/v1/oauth2', SSO_SERVICE_URL);
                url.searchParams.set('authorizationURL', data.authorizationUrl);
                url.searchParams.set('tokenURL', data.tokenUrl);
                url.searchParams.set('clientID', data.clientId);
                url.searchParams.set('clientSecret', data.clientSecret);
                url.searchParams.set('redirectURL', this.httpCallback.getCallbackUrl());
                const res = await this.httpCallback.open(url);
                const {
                    accessToken,
                    refreshToken,
                    expiresAt,
                } = res?.query ?? {};
                data.accessToken = accessToken;
                data.refreshToken = refreshToken;
                data.expiresAt = Number(expiresAt) || undefined;
                await this.saveCredentials(spec, this.param);
                return;
            }
            default: {
                await this.saveCredentials(spec, this.param);
            }
        }
    }

    protected async saveCredentials(spec: CreateCredentialsSpec, param: model.ParamSpec) {
        const { name, config, data } = spec;
        const { providerName } = param;
        const creds = await this.apiRequest.post('/Credentials/saveCredentials', {
            body: {
                name,
                credentialsType: config.type,
                providerName,
                data,
            }
        });
        await this.fetchAvailableCredentials();
        (this.item as any)[param.name] = creds;
        this.modals.hide();
    }

    protected async deleteCredentials(id: string) {
        await this.apiRequest.post('/Credentials/deleteCredentials', {
            body: { id }
        });
        await this.fetchAvailableCredentials();
    }

}

export interface CreateCredentialsSpec {
    name: string;
    providerName: string;
    config: CredentialsConfig;
    data: CredentialsData;
}
