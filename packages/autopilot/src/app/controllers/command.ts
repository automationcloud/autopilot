import { injectable, inject } from 'inversify';
import { controller } from '../controller';
import { SettingsController } from '../controllers';
import { ApiLoginController } from './api-login';

@injectable()
@controller()
export class CommandController {

    constructor(
        @inject(SettingsController)
        protected settings: SettingsController,
        @inject(ApiLoginController)
        protected apiLogin: ApiLoginController,
    ) {
    }

    async init() {}

    showEnv() {
        return console.info('🏡You are on ' + this.settings.env);
    }

    switchToStaging() { this.setEnv('staging'); }

    switchToProduction() { this.setEnv('production'); }

    protected async setEnv(env: 'staging' | 'production') {
        if (this.settings.env === env) {
            return console.info('🤗 You are already on ' + env);
        }
        console.info(`👾 Switching to ${env}...`);
        await this.settings.setEnv(env);

        try {
            await this.apiLogin.silentLogin();
        } catch (error) {
            console.info(`⛔ Not signed in`);
        }

        this.showEnv();
    }
}
