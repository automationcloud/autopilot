import { Action } from '../action';
import { CheckpointService } from '../services';

export class CheckpointAction extends Action {
    static $type = 'Flow.checkpoint';
    static $icon = 'fas fa-map-marker';
    static $help = '';

    get $checkpoints() {
        return this.$engine.get(CheckpointService);
    }

    async exec() {
        const data = await this.$checkpoints.createCheckpoint(this.label);
        await this.$checkpoints.sendCheckpoint(data);
    }
}
