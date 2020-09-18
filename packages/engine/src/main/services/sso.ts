import { Exception } from '@automationcloud/cdp';
import { injectable } from 'inversify';

@injectable()
export class SsoService {

    async exchangeOAuth1Credentials(_config: SsoOAuth1Config): Promise<SsoOAuth1Credentials> {
        throw new Exception({
            name: 'SsoUnavailable',
            message: 'SSO is not available in current runtime',
            retry: false,
        });
    }

    async exchangeOAuth2Credentials(_config: SsoOAuth2Config): Promise<SsoOAuth2Credentials> {
        throw new Exception({
            name: 'SsoUnavailable',
            message: 'SSO is not available in current runtime',
            retry: false,
        });
    }

}

export interface SsoOAuth1Config {
    requestTokenURL: string;
    accessTokenURL: string;
    userAuthorizationURL: string;
    consumerKey: string;
    consumerSecret: string;
}

// TODO modify those as needed
export interface SsoOAuth1Credentials {
    oauthToken: string;
    oauthTokenSecret: string;
}

export interface SsoOAuth2Config {
    authorizationURL: string;
    tokenURL: string;
    clientID: string;
    clientSecret: string;
}

// TODO modify those as needed
export interface SsoOAuth2Credentials {
    refreshToken: string;
    accessToken: string;
    expiresAt: number;
}
