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
            case 'oauth1': {
                return new r.OAuth1Agent({ ...prop, ...data });
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

export type CredentialsType = 'basic' | 'bearer' | 'oauth1' | 'oauth2';

export type CredentialsConfig =
    CredentialsBasicConfig |
    CredentialsBearerConfig |
    CredentialsOAuth1Config |
    CredentialsOAuth2Config;

export type CredentialsData =
    CredentialsBasicData |
    CredentialsBearerData |
    CredentialsOAuth1Data |
    CredentialsOAuth2Data;

export interface CredentialsBasicConfig {
    type: 'basic';
    usernameLabel?: string;
    passwordLabel?: string;
    help?: string;
}

export interface CredentialsBasicData {
    username: string;
    password: string;
}

export interface CredentialsBearerConfig {
    type: 'bearer';
    prefix?: string;
    help?: string;
}

export interface CredentialsBearerData {
    prefix: string;
    token: string;
}

export interface CredentialsOAuth1Config {
    type: 'oauth1';
    requestTokenUrl: string;
    accessTokenUrl: string;
    userAuthorizationUrl: string;
    signatureMethod?: r.OAuth1SignatureMethod;
    customConfig?: boolean;
    help?: string;
}

export interface CredentialsOAuth1Data {
    requestTokenUrl: string;
    accessTokenUrl: string;
    userAuthorizationUrl: string;
    signatureMethod: r.OAuth1SignatureMethod;
    consumerKey: string;
    consumerSecret: string;

    tokenKey?: string;
    tokenSecret?: string;
    privateKey?: string; // when signatureMethod is RSA_SHA1
    version?: string;
    realm?: string;
    callback?: string;
    verifier?: string;
    timestamp?: string;
    nonce?: string;
    includeBodyHash?: boolean;
}

export interface CredentialsOAuth2Config {
    type: 'oauth2';
    // grantTypes: CredentialsOAuth2GrantType[];
    authorizationUrl: string;
    tokenUrl: string;
    scope: string;
    customConfig?: boolean;
    help?: string;
}

export interface CredentialsOAuth2Data {
    authorizationUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string;
    refreshToken?: string;
    accessToken?: string;
    expiresAt?: number;
}

// export type OAuth2GrantType = 'authorization_code' | 'client_credentials' | 'refresh_token';
