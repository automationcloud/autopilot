import {
    Action,
    ApiRequest,
    CredentialsConfig,
    CredentialsData,
    model,
    Pipe,
    StoredCredentials,
} from '@automationcloud/engine';
import { params } from '@automationcloud/engine/out/main/model';
import { inject, injectable } from 'inversify';

import { controller } from '../controller';
import { ModalsController } from './modals';
import { NotificationsController } from './notifications';

@injectable()
@controller({
    alias: 'credentials',
})
export class CredentialsController {
    // We'll write the credentials here
    item: Action | Pipe | null = null;
    param: params.ParamSpec | null = null;

    availableCredentials: StoredCredentials[] = [];

    constructor(
        @inject(ModalsController)
        protected modals: ModalsController,
        @inject(ApiRequest)
        protected apiRequest: ApiRequest,
        @inject(NotificationsController)
        protected notifications: NotificationsController,
    ) {}

    async init() {
        await this.fetchAvailableCredentials();
    }

    async login(item: Action | Pipe, param: model.ParamSpec) {
        if (param.type !== 'credentials') {
            return;
        }
        this.item = item;
        this.param = param;
        this.modals.show('create-credentials');
    }

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

    async fetchAvailableCredentials() {
        const { entities } = await this.apiRequest.get('/Credentials/listCredentials');
        this.availableCredentials = entities;
    }

    async saveCredentials(name: string, config: CredentialsConfig, data: CredentialsData) {
        if (!this.param) {
            // OR throw?
            return;
        }
        const { providerName } = this.param;
        const { type } = config;
        const creds = await this.apiRequest.post('/Credentials/saveCredentials', {
            body: {
                name,
                credentialsType: type,
                providerName,
                data,
            }
        });
        await this.fetchAvailableCredentials();
        (this.item as any)[this.param.name] = creds;
        this.modals.hide();
    }

    async deleteCredentials(id: string) {
        await this.apiRequest.delete('/Credentials/deleteCredentials', {
            query: { id }
        });
        await this.fetchAvailableCredentials();
    }

}
