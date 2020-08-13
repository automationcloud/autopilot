import { CheckpointService, CheckpointData } from '@automationcloud/engine';
import { injectable } from 'inversify';

@injectable()
export class AutopilotCheckpointService extends CheckpointService {
    async sendCheckpoint(checkpointData: CheckpointData): Promise<void> {
        console.info('Checkpoint', checkpointData);
    }
}
