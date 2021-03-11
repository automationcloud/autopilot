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

import { Configuration, ProxyService, SessionHandler, stringConfig } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';

import { Execution, ProxyConnection } from '../types';
import { ApiService } from './api';
import { WorkerState } from './state';

const ROXI_HOST = stringConfig('ROXI_HOST', '');
const ROXI_SECRET = stringConfig('ROXI_SECRET', '');

@injectable()
@SessionHandler()
export class ProxySetupService {
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
        const { hostname, port, username, password } = connection;
        this.proxy.clearRoutes();
        const upstream = {
            host: `${hostname}:${port}`,
            username,
            password,
        };
        this.proxy.defaultUpstream = upstream;
        this.state.proxyUpstream = upstream;
        if (this.config.get(ROXI_SECRET)) {
            await this.setupLegacyExecutionRoutes(execution, connection);
        }
    }

    // TODO remove when Roxi is dealt with
    async setupLegacyExecutionRoutes(execution: Execution, connection: ProxyConnection) {
        const useRoxiCache = execution.options?.useRoxiCache || false;
        const username = encodeURIComponent(
            JSON.stringify({
                ...connection,
                cache: useRoxiCache,
                partition: execution.id,
            }),
        );
        this.proxy.addRoute(/.*/, {
            host: this.config.get(ROXI_HOST),
            username,
            password: this.config.get(ROXI_SECRET),
            useHttps: true,
        }, 'roxi');
    }
}
