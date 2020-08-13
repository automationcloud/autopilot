import { Command } from '../../command';
import { ScriptEditorViewport } from '.';
import { clipboard } from '../../util';

export class CopyPipeCommand extends Command<ScriptEditorViewport> {
    static title = 'Copy';

    isUndoable() {
        return false;
    }

    canExecute() {
        return this.viewport.getSelectedItems().length > 0;
    }

    protected async apply() {
        const items = this.viewport.getSelectedItems();
        clipboard.writeObject({
            type: 'pipes',
            data: items,
        });
        console.info(`Copied ${items.length} pipes to clipboard`);
    }

    protected async unapply() {}
}
