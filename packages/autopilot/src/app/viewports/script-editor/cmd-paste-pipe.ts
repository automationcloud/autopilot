import { Command } from '../../command';
import { ScriptEditorViewport } from '.';
import { clipboard } from '../../util';
import { model } from '@automationcloud/engine';

export class PastePipeCommand extends Command<ScriptEditorViewport> {
    listPath: string = '';
    specs: any[] | null = null;
    ids: string[] = [];

    static title = 'Paste';

    isUndoable() {
        return true;
    }

    canExecute() {
        if (clipboard.hasObjectType('pipes')) {
            return this.viewport.getPipeInsertLocation() != null;
        }
        return false;
    }

    protected async apply() {
        const location = this.viewport.getPipeInsertLocation()!;
        this.listPath = location.list.$path;
        this.ids = [];
        // Only grab from clipboard initially; for Redo grab from local state
        const data = this.specs == null ? clipboard.readObjectData() : this.specs;
        const specs = data == null ? [] : Array.isArray(data) ? data : [data];
        this.specs = specs;

        this.viewport.clearSelection();
        let idx = location.index;
        for (const spec of specs) {
            const item = location.list.insert(spec, idx);
            idx += 1;
            this.ids.push(item.id);
            this.viewport.addToSelection(item);
        }
        this.app.project.update();
    }

    protected async unapply() {
        const list = this.script.get(this.listPath);
        if (!(list instanceof model.EntityList)) {
            return this.throw('Cannot undo: illegal command state');
        }
        list.removeWhere(_ => this.ids.includes(_.id));
        this.app.project.update();
    }
}