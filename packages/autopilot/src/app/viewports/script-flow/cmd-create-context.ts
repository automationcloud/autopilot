import { Command } from '../../command';
import { ScriptFlowViewport } from '.';
import { ContextType } from '@automationcloud/engine';

export class CreateContextCommand extends Command<ScriptFlowViewport> {
    newId: string | null = null;
    type: ContextType;

    static title = 'Create Context';

    constructor(viewport: ScriptFlowViewport, type: ContextType = 'context') {
        super(viewport);
        this.type = type;
    }

    isUndoable() {
        return true;
    }

    canExecute() {
        return this.viewport.getContextInsertLocation() != null;
    }

    protected async apply() {
        const location = this.viewport.getContextInsertLocation()!;
        // Preserve id for undo/redo
        const spec: any = this.newId ? { id: this.newId } : {};
        spec.type = this.type;
        const context = this.script.contexts.insert(spec, location.index);
        this.newId = context.id;
        this.viewport.selectItem(context);
        this.app.ui.expandable.expand(context.id);
        this.app.project.update();
    }

    protected async unapply() {
        this.script.contexts.removeWhere(_ => _.id === this.newId);
        this.app.project.update();
    }
}
