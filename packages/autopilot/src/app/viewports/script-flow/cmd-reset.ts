import { Command } from '../../command';
import { ScriptFlowViewport } from '.';

export class ResetCommand extends Command<ScriptFlowViewport> {
    static title = 'Reset';

    isUndoable() {
        return false;
    }

    canExecute() {
        return this.viewport.getSelectedItems().length > 0;
    }

    protected async apply() {
        const items = this.viewport.getSelectedItems();
        for (const item of items) {
            item.reset();
        }
    }

    protected async unapply() {}
}
