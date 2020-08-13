import { stringConfig, Configuration, ProxyService, SessionHandler } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';
import { Execution } from '../types';
import { ApiService } from './api';
import { WorkerState } from './state';

const ROXI_HOST = stringConfig('ROXI_HOST');
const ROXI_SECRET = stringConfig('ROXI_SECRET');

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
        const useRoxiCache = execution.options?.useRoxiCache || false;
        const { connection } = await this.api.getProxyConfig(execution.proxyId);
        const username = encodeURIComponent(
            JSON.stringify({
                ...connection,
                cache: useRoxiCache,
                partition: execution.id,
            }),
        );
        this.proxy.clearRoutes();
        this.proxy.addRoute(/.*/, {
            host: this.config.get(ROXI_HOST),
            username,
            password: this.config.get(ROXI_SECRET),
        });
    }
}
