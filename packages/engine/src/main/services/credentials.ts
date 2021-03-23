import * as r from '@automationcloud/request';
import { inject, injectable } from 'inversify';

import { util } from '..';
import { ApiRequest } from './api-request';

@injectable()
export class CredentialsService {

    constructor(
        @inject(ApiRequest)
        protected api: ApiRequest,
    ) {}

    protected async resolveCredentials(prop: any): Promise<CredentialsData | null> {
        const id = (prop as any)?.id ?? null;
        if (!id) {
            return null;
        }
        return await this.api.get('/Credentials/getCredentialsData', {
            query: { id }
        });
    }

    async getCredentials(prop: any): Promise<CredentialsData> {
        const credentials = await this.resolveCredentials(prop);
        if (credentials == null) {
            throw util.createError({
                code: 'CredentialsNotFound',
                message: `No valid credentials found. You may need to log in with your account details.`,
                retry: false,
            });
        }
        return credentials;
    }

    async getAuthAgent(prop: any): Promise<r.AuthAgent> {
        if (prop == null) {
            return new r.NoAuthAgent();
        }
        const data = await this.getCredentials(prop);
        // If we have data, assuming token is intact
        switch (prop.credentialsType) {
            case 'basic': {
                const { username, password } = data as CredentialsBasicData;
                return new r.BasicAuthAgent({ username, password });
            }
            case 'bearer': {
                const { token } = data as CredentialsBearerData;
                const { prefix } = prop as CredentialsBearerConfig;
                return new r.BearerAuthAgent({ token, prefix });
            }
            case 'oauth2': {
                return new r.OAuth2Agent({ ...prop, ...data });
            }
            default:
                throw util.createError({
                    code: 'CredentialsNotSupported',
                    message: `This type of credentials is not supported.`,
                    retry: false,
                });
        }
    }

}

export interface StoredCredentials {
    id: string;
    name: string;
    providerName: string;
    credentialsType: CredentialsType;
    createdAt: number;
    updatedAt: number;
}

// TODO oauth1
export type CredentialsType = 'basic' | 'bearer' | 'oauth2';

export type CredentialsConfig =
    CredentialsBasicConfig |
    CredentialsBearerConfig |
    CredentialsOAuth2Config;

export interface CredentialsBasicConfig {
    type: 'basic';
    usernameLabel?: string;
    passwordLabel?: string;
    help?: string;
}

export interface CredentialsBearerConfig {
    type: 'bearer';
    prefix?: string;
    help?: string;
}

// export type CredentialsOAuth2GrantType = 'authorization_code' | 'client_credentials' | 'refresh_token';

export interface CredentialsOAuth2Config {
    type: 'oauth2';
    // grantTypes: CredentialsOAuth2GrantType[];
    authorizationUrl: string;
    tokenUrl: string;
    scopes: string;
    customConfig?: boolean;
    help?: string;
}

export type CredentialsData =
    CredentialsBasicData |
    CredentialsBearerData |
    CredentialsOAuth2Data;

export interface CredentialsBasicData {
    username: string;
    password: string;
}

export interface CredentialsBearerData {
    token: string;
}

export interface CredentialsOAuth2Data {
    authorizationUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    refreshToken?: string;
    accessToken?: string;
    expiresAt?: number;
}
