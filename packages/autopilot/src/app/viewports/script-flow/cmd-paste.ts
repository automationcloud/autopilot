import { Command } from '../../command';
import { ScriptFlowViewport } from '.';
import { clipboard } from '../../util';
import { model } from '@automationcloud/engine';
import { InsertLocation } from '../script-viewport';

/**
 * Pastes the context of clipboard according to following rules:
 *
 * Clipboard   Selected    Resolution
 * ------------------------------------------------------
 * nothing     *           abort
 * contexts    none        insert contexts at bottom
 * contexts    context     insert contexts after selected
 * contexts    action      insert after the enclosing context
 * actions     none        abort
 * actions     context     abort
 * actions     action      insert actions after selected
 */
export class FlowPasteCommand extends Command<ScriptFlowViewport> {
    listPath: string = '';
    specs: any[] | null = null;
    ids: string[] = [];

    static title = 'Paste';

    isUndoable() {
        return true;
    }

    canExecute() {
        return this.getInsertLocation() != null;
    }

    getInsertLocation(): InsertLocation | null {
        switch (clipboard.getObjectType()) {
            case 'contexts': {
                return this.viewport.getContextInsertLocation();
            }
            case 'actions': {
                return this.viewport.getActionInsertLocation();
            }
            default: {
                return null;
            }
        }
    }

    protected async apply() {
        const location = this.getInsertLocation()!;
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
