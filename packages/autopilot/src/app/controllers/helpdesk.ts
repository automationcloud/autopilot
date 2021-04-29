// Copyright 2021 UBIO Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { inject, injectable } from 'inversify';

import { controller } from '../controller';
import { ApiController } from './api';
import { NotificationsController } from './notifications';

@injectable()
@controller({ alias: 'helpdesk' })
export class HelpdeskController {
    constructor(
        @inject(ApiController)
        protected api: ApiController,
        @inject(NotificationsController)
        protected notifications: NotificationsController,
    ) {}

    async init() {}

    async createConnectorTicket(spec: {
        name: string,
        email: string,
        details: string,
        url?: string,
    }) {
        try {
            return await this.api.createHelpTicket({
                subject: 'Request for a new API connector',
                email: spec.email,
                name: spec.name,
                text: [
                    `${spec.details}`,
                    `URL: ${spec.url ?? 'Not provided'}`,
                    '** Ticket created from Autopilot **'
                ].join('\n\n'),
                category: 2, // automation cloud support
                priority: 2,
            });
        } catch (error) {
            this.notifications.removeById('helpdesk');
            this.notifications.add({
                id: 'helpdesk',
                level: 'error',
                title: 'Sending failed',
                message: 'Sorry, we couldn\'t send your API Connector request. Please try again',
                primaryAction: {
                    title: 'Cancel',
                    action: () => {
                        this.notifications.removeById('helpdesk');
                    }
                }
            });
            throw error;
        }
    }


}
