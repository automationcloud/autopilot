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

import { Configuration, ProxyService, SessionHandler } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';
import { Execution } from '../types';
import { ApiService } from './api';
import { WorkerState } from './state';

// TODO rename!
@injectable()
@SessionHandler()
export class RoxiService {
    constructor(
        @inject(Configuration)
        protected config: Configuration,
        @inject(ApiService)
        protected api: ApiService,
        @inject(ProxyService)
        protected proxy: ProxyService,
        @inject(WorkerState)
        protected state: WorkerState,
    ) {}

    async onSessionStart() {
        const execution = this.state.execution;
        if (execution) {
            await this.setupExecutionRoutes(execution);
        }
    }

    async onSessionFinish() {
        this.proxy.closeAllSockets();
    }

    async setupExecutionRoutes(execution: Execution) {
        const connection = await this.api.getProxyConnection(execution.proxyId);
        this.proxy.clearRoutes();
        this.proxy.addRoute(/.*/, {
            host: `${connection.hostname}:${connection.port}`,
            username: encodeURIComponent(connection.username),
            password: encodeURIComponent(connection.password),
            useHttps: false,
        });
        this.state.proxyConnection = { ...connection, password: '' };
    }
}
