import { EditEntityCommand } from './cmd';
import { Script } from '@automationcloud/engine';
import { ScriptEditorViewport } from '.';

export class EditScriptCommand extends EditEntityCommand<Script> {
    static title = 'Edit Script';

    constructor(viewport: ScriptEditorViewport, key: string, value: any) {
        super(viewport, '', key, value);
    }

    validateEntity(entity: Script): boolean {
        return entity instanceof Script;
    }
}
