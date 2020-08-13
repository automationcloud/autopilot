import { injectable, inject } from 'inversify';
import { WorkerState } from './state';
import { ApiService } from './api';
import { Logger, Configuration, numberConfig } from '@automationcloud/engine';

const HEARTBEAT_INTERVAL = numberConfig('HEARTBEAT_INTERVAL', 5000);

@injectable()
export class HeartbeatsService {
    @inject(Configuration)
    config!: Configuration;
    @inject(WorkerState)
    state!: WorkerState;
    @inject(ApiService)
    api!: ApiService;
    @inject(Logger)
    logger!: Logger;

    heartbeating: boolean = false;

    start() {
        this.heartbeating = true;
        this.heartbeat().catch(() => {});
    }

    stop() {
        this.heartbeating = false;
    }

    async heartbeat() {
        const interval = this.config.get(HEARTBEAT_INTERVAL);
        while (this.heartbeating) {
            try {
                await this.api.sendHeartbeat(this.state.executionId, this.state.state, this.state.getInfo());
            } catch (error) {
                this.logger.error('Failed to send heartbeat', { error });
            }
            await new Promise(r => setTimeout(r, interval));
        }
    }
}
