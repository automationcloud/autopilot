import { ScriptEditorViewport } from '.';
import { PastePipeCommand } from './cmd-paste-pipe';

export class InsertPipeRecipeCommand extends PastePipeCommand {
    static title = 'Insert Pipe Recipe';

    constructor(viewport: ScriptEditorViewport, specs: any[]) {
        super(viewport);
        this.specs = specs;
    }

    canExecute() {
        return this.viewport.getPipeInsertLocation() != null;
    }
}
