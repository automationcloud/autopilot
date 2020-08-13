import { injectable, inject } from 'inversify';
import { FlowService, Script, util, ReporterService, Logger } from '@automationcloud/engine';
import { WorkerState } from '../services/state';
import { InputsService } from '../services/inputs';
import { ApiService } from '../services/api';

@injectable()
export class WorkerFlowService extends FlowService {
    constructor(
        @inject(Logger)
        protected logger: Logger,
        @inject(WorkerState)
        protected state: WorkerState,
        @inject(InputsService)
        protected inputs: InputsService,
        @inject(ReporterService)
        protected reporter: ReporterService,
        @inject(ApiService)
        protected api: ApiService,
    ) {
        super();
    }

    async tick(script: Script) {
        await super.tick(script);
        switch (this.state.state) {
            case 'terminating-execution':
                throw util.createError({
                    code: 'ExecutionTerminated',
                    message: 'Execution terminated during playback',
                    retry: false,
                });
            case 'disconnected':
                throw util.createError({
                    code: 'BrowserCrashed',
                    message: 'Browser crashed unexpectedly',
                    retry: false,
                });
        }
    }

    async requestInputData(key: string): Promise<any> {
        return await this.inputs.requestInputData(key);
    }

    async peekInputData(key: string): Promise<any> {
        return await this.inputs.peekInputData(key);
    }

    async sendOutputData(key: string, data: any): Promise<void> {
        const execution = this.state.getExecution();
        this.logger.info(`Sending output ${key}`, { key, data });
        await this.reporter.sendEvent('info', 'output.emit', {
            details: { key, data },
        });
        await this.api.sendOutputData(execution.id, key, data);
    }

    getMetadata() {
        return this.state.getInfo();
    }
}
