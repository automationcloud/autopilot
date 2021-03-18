import { injectable } from 'inversify';

import { util } from '..';

@injectable()
export class CredentialsService {

    protected async resolveCredentials(_token: unknown): Promise<CredentialsData | null> {
        return null;
    }

    async getCredentials(token: unknown): Promise<CredentialsData> {
        const credentials = await this.resolveCredentials(token);
        if (credentials == null) {
            throw util.createError({
                code: 'CredentialsNotFound',
                message: `No valid credentials found. You may need to log in with your account details.`,
                retry: false,
            });
        }
        return credentials;
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

export type CredentialsOAuth2GrantType = 'authorization_code' | 'client_credentials' | 'refresh_token';

export interface CredentialsOAuth2Config {
    type: 'oauth2';
    grantTypes: CredentialsOAuth2GrantType[];
    authorizationUrl: string;
    tokenUrl: string;
    help?: string;
    scopes: string;
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
    clientId: string;
    clientSecret: string;
    refreshToken?: string;
    accessToken?: string;
}
