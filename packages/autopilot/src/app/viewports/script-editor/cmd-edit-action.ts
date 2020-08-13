import { EditEntityCommand } from './cmd';
import { Action } from '@automationcloud/engine';

export class EditActionCommand extends EditEntityCommand<Action> {
    static title = 'Edit Action';

    validateEntity(entity: Action): boolean {
        return entity instanceof Action;
    }
}
