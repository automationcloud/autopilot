import { Logger, CheckpointService, GlobalsService, BrowserService, CheckpointData } from '@automationcloud/engine';
import { injectable, inject } from 'inversify';
import { ApiService } from '../services/api';
import { WorkerState } from '../services/state';

@injectable()
export class WorkerCheckpointService extends CheckpointService {
    constructor(
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(GlobalsService)
        protected globals: GlobalsService,
        @inject(Logger)
        protected logger: Logger,
        @inject(ApiService)
        protected api: ApiService,
        @inject(WorkerState)
        protected state: WorkerState,
    ) {
        super(browser, globals);
    }

    async sendCheckpoint(checkpointData: CheckpointData) {
        this.logger.info('Creating checkpoint');
        const execution = this.state.getExecution();
        const script = this.state.getScript();
        const consumedInputKeys = [...script.$consumedInputKeys];
        const checkpoint = await this.api.createCheckpoint(execution.id, consumedInputKeys, checkpointData);
        const { id: checkpointId } = checkpoint;
        this.logger.info('Created checkpoint', { checkpointId });
    }
}
