// Copyright 2020 Ubio Limited
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
import { EventBus } from '../event-bus';

export class AutopilotApiRequest extends ApiRequest {

    constructor(
        @inject(Configuration)
        protected config: Configuration,
        @inject(EventBus)
        protected events: EventBus,
    ) {
        super(config);
        this.events.on('settingsReady', () => this.setup());
        this.events.on('settingsUpdated', () => this.setup());
    }

    setup() {
        super.setup();
        this.request.on('retry', (error, info) => {
            console.debug('API request failed, retrying', info, error);
        });
        // this.request.on('beforeSend', info => console.debug(info.method, info.url, info.headers));
    }

}
