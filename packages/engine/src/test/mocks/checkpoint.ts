import { CheckpointService, CheckpointData } from '../../main';
import { injectable } from 'inversify';

@injectable()
export class CheckpointServiceMock extends CheckpointService {
    checkpoint: CheckpointData | null = null;

    async sendCheckpoint(checkpointData: CheckpointData) {
        this.checkpoint = checkpointData;
    }
}
