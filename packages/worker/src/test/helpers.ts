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

import { injectable, inject } from 'inversify';
import { Runner } from '../main/services/runner';
import { ApiRequest } from '@automationcloud/engine';

@injectable()
export class TestHelpers {
    constructor(
        @inject(ApiRequest)
        protected api: ApiRequest,
        @inject(Runner)
        protected runner: Runner,
    ) {}

    async getExecutionById(executionId: string): Promise<any> {
        return await this.api.get(`/private/executions/${executionId}`, {
            headers: {
                'x-ubio-organisation-id': 'test-organisation-id',
            }
        });
    }

    async createExecution(execution: any): Promise<any> {
        return await this.api.post('/~/executions', {
            body: execution,
        });
    }

    async runNewExecution(executionSpec: any): Promise<void> {
        const execution = await this.createExecution(executionSpec);
        await this.runner.run(execution.id, 'test-organisation-id');
    }

    async getProxyRoute(id: string) {
        return await this.api.get(`/Proxy/getProxyConnection`, {
            query: { id },
        });
    }
}
