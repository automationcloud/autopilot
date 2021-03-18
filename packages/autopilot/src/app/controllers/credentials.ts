import { Action, model, Pipe } from '@automationcloud/engine';
import { CredentialsConfig, params } from '@automationcloud/engine/out/main/model';
import { injectable } from 'inversify';

import { controller } from '../controller';

@injectable()
@controller({
    alias: 'credentials',
})
export class CredentialsController {
    // We'll write the credentials here
    configuredItem: Action | Pipe | null = null;
    configuredParam: params.ParamSpec | null = null;

    async init() {

    }

    async login(item: Action | Pipe, param: model.ParamSpec) {
        if (param.type !== 'credentials') {
            return;
        }
        this.configuredItem = item;
        this.configuredParam = param;
        const config: CredentialsConfig = param.config;
        switch (config.type) {
            case 'basic': return this.loginBasic();
            case 'bearer': return this.loginBearer();
            case 'oauth2': return this.loginOAuth2();
        }
    }

    loginBasic() {

    }

    loginBearer() {

    }

    loginOAuth2() {

    }

}
