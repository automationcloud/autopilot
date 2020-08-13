import { Command } from '../../command';
import { ScriptFlowViewport } from '.';
import { clipboard } from '../../util';

export class FlowCopyCommand extends Command<ScriptFlowViewport> {
    static title = 'Copy';

    isUndoable() {
        return false;
    }

    canExecute() {
        return this.viewport.getSelectedItems().length > 0;
    }

    protected async apply() {
        const items = this.viewport.getSelectedItems();
        const type = items[0].$entityType === 'action' ? 'actions' : 'contexts';
        clipboard.writeObject({
            type,
            data: items,
        });
        console.info(`Copied ${items.length} ${type} to clipboard`);
    }

    protected async unapply() {}
}
