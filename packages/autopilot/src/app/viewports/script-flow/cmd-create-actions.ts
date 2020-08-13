import { Command } from '../../command';
import { ScriptFlowViewport } from '.';
import { model } from '@automationcloud/engine';

export class CreateActionsCommand extends Command<ScriptFlowViewport> {
    newSpecs: any[];
    listPath: string = '';
    specs: any[] | null = null;
    ids: string[] = [];

    static title = 'Create Actions';

    constructor(viewport: ScriptFlowViewport, newSpecs: any[]) {
        super(viewport);
        this.newSpecs = newSpecs;
    }

    isUndoable() {
        return true;
    }

    canExecute() {
        return this.viewport.getActionInsertLocation() != null;
    }

    protected async apply() {
        const location = this.viewport.getActionInsertLocation()!;
        this.listPath = location.list.$path;
        this.ids = [];
        // Only grab from clipboard initially; for Redo grab from local state
        const data = this.specs == null ? this.newSpecs : this.specs;
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
