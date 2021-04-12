// Copyright 2020 UBIO Limited
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

import { ApiRequest, Configuration } from '@automationcloud/engine';
import { inject } from 'inversify';

import { EventsController } from '../controllers/events';

export class AutopilotApiRequest extends ApiRequest {
    _accessToken: string | null = null;

    constructor(
        @inject(Configuration)
        protected config: Configuration,
        @inject(EventsController)
        protected events: EventsController,
    ) {
        super(config);
        this.events.on('settingsReady', () => this.setup());
        this.events.on('settingsUpdated', () => this.setup());
    }

    setup() {
        super.setup();
        // to listen to accessToken changes
        Object.defineProperty(this.authAgent.params, 'accessToken', {
            get: () => {
                return this._accessToken;
            },
            set: newValue => {
                this._accessToken = newValue;
                this.events.emit('tokenUpdated');
            }
        });
        this.request.onRetry = (error, info) => {
            console.debug('[api-request] onRetry: API request failed, retrying', info, error);
        };
        this.request.onError = (error, info) => {
            console.debug('[api-request] onError: API request failed', { error, info });
            if (info.status === 401) {
                console.info('API responded with 401', { details: info });
                this.events.emit('apiAuthError');
            }
        };
    }

}
