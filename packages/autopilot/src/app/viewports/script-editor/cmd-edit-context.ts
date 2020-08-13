import { EditEntityCommand } from './cmd';
import { Context } from '@automationcloud/engine';

export class EditContextCommand extends EditEntityCommand<Context> {
    static title = 'Edit Context';

    validateEntity(entity: Context): boolean {
        return entity instanceof Context;
    }
}
