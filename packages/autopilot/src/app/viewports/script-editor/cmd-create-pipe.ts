import { ScriptEditorViewport } from '.';
import { ScriptEditorCommand } from './cmd';
import { Pipeline } from '@automationcloud/engine';

export class CreatePipeCommand extends ScriptEditorCommand {
    newSpec: any;
    listPath: string = '';
    newId: string = '';

    static title = 'Create Pipe';

    constructor(viewport: ScriptEditorViewport, newSpec: any) {
        super(viewport);
        this.newSpec = newSpec;
    }

    isUndoable() {
        return true;
    }

    canExecute() {
        return this.viewport.getPipeInsertLocation() != null;
    }

    protected async apply() {
        const location = this.viewport.getPipeInsertLocation()!;
        const spec: any = { ...this.newSpec };
        this.listPath = location.list.$path;
        // Preserve id for undo/redo
        if (this.newId) {
            spec.id = this.newId;
        }
        const pipe = location.list.insert(spec, location.index);
        this.newId = pipe.id;
        this.viewport.selectItem(pipe);
        this.viewport.app.expandable.expand(pipe.id);
        this.app.project.update();
    }

    protected async unapply() {
        const list = this.script.get(this.listPath);
        if (!(list instanceof Pipeline)) {
            return this.throw('Cannot undo: illegal command state');
        }
        list.removeWhere(_ => _.id === this.newId);
        this.app.project.update();
    }
}
