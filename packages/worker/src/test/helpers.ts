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
        return await this.api.get(`/private/executions/${executionId}`);
    }

    async createExecution(execution: any): Promise<any> {
        return await this.api.post('/~/executions', {
            body: execution,
        });
    }

    async runNewExecution(executionSpec: any): Promise<void> {
        const execution = await this.createExecution(executionSpec);
        await this.runner.run(execution.id);
    }

    async getProxyRoute(id: string) {
        return await this.api.get(`/Proxy/get`, {
            query: { id },
        });
    }
}
