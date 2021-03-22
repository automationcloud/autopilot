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
    // These are available in our lists
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

    async login(spec: CreateCredentialsSpec) {
        if (!this.param) {
            // OR throw?
            return;
        }
        await this.saveCredentials(spec, this.param);
    }

    protected async saveCredentials(spec: CreateCredentialsSpec, param: params.ParamSpec) {
        const { name, config, data, providerName } = spec;
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
        await this.apiRequest.delete('/Credentials/deleteCredentials', {
            query: { id }
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
