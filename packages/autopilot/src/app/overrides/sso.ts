import {
    SsoService,
    SsoOAuth1Config,
    SsoOAuth2Config,
    SsoOAuth1Credentials,
    SsoOAuth2Credentials,
    numberConfig,
    Configuration,
    stringConfig,
    Exception,
} from '@automationcloud/engine';
import { inject, injectable } from 'inversify';
import { controller } from '../controller';
import { ipcRenderer, shell } from 'electron';
import { controlServerPort } from '../globals';
import { StorageController } from '../controllers';
import { EventBus } from '../event-bus';

const SSO_TIMEOUT = numberConfig('SSO_TIMEOUT', 60000);
const SSO_URL = stringConfig('SSO_URL', 'https://sso.extensions.automationcloud.net');

@injectable()
@controller()
export class AutopilotSsoService extends SsoService {

    constructor(
        @inject(Configuration)
        protected config: Configuration,
        @inject(StorageController)
        protected storage: StorageController,
        @inject(EventBus)
        protected events: EventBus,
    ) {
        super();
    }

    async init() {
        ipcRenderer.on('ssoResult', (_ev, result) => this.events.emit('ssoResult', result));
    }

    get baseUrl() {
        return this.config.get(SSO_URL);
    }

    get timeout() {
        return this.config.get(SSO_TIMEOUT);
    }

    async exchangeOAuth1Credentials(config: SsoOAuth1Config): Promise<SsoOAuth1Credentials> {
        const query = {
            requestTokenURL: config.requestTokenURL,
            accessTokenURL: config.accessTokenURL,
            userAuthorizationURL: config.userAuthorizationURL,
            consumerKey: config.consumerKey,
            consumerSecret: config.consumerSecret,
            redirectURL: `http://localhost:${controlServerPort}/ssoCallback`,
            profileId: this.storage.profileId,
        };
        const url = new URL('/oauth', this.baseUrl);
        for (const [key, value] of Object.entries(query)) {
            url.searchParams.append(key, value);
        }
        await shell.openExternal(url.toString());
        return await this.waitForSsoResult();
    }

    async exchangeOAuth2Credentials(config: SsoOAuth2Config): Promise<SsoOAuth2Credentials> {
        const query = {
            authorizationURL: config.authorizationURL,
            tokenURL: config.tokenURL,
            clientID: config.clientID,
            clientSecret: config.clientSecret,
            redirectURL: `http://localhost:${controlServerPort}/ssoCallback`,
            profileId: this.storage.profileId,
        };
        const url = new URL('/oauth2', this.baseUrl);
        for (const [key, value] of Object.entries(query)) {
            url.searchParams.append(key, value);
        }
        await shell.openExternal(url.toString());
        return await this.waitForSsoResult();
    }

    protected async waitForSsoResult(): Promise<any> {
        // TODO consider filtering based on requested details,
        // if we need to run a couple of those in parallel
        return await new Promise((resolve, reject) => {
            const cleanup = () => {
                clearTimeout(timer);
                this.events.removeListener('ssoResult', onSsoResult);
            };
            const timer = setTimeout(() => {
                cleanup();
                reject(new Exception({
                    name: 'SsoTimeout',
                    message: 'Timeout waiting for SSO response',
                }));
            }, this.timeout);
            const onSsoResult = (payload: any) => {
                cleanup();
                resolve(payload);
            };
            this.events.addListener('ssoResult', onSsoResult);
        });
    }

}
