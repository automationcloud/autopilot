import { EditEntityCommand } from './cmd';
import { Pipe } from '@automationcloud/engine';

export class EditPipeCommand extends EditEntityCommand<Pipe> {
    static title = 'Edit Pipe';

    validateEntity(entity: Pipe): boolean {
        return entity instanceof Pipe;
    }

    protected shouldExpand(): boolean {
        if (this.key === 'enabled') {
            return false;
        }
        return true;
    }
}
