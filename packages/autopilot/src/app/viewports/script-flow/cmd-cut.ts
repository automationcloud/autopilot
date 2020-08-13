import { FlowDeleteCommand } from './cmd-delete';
import { clipboard } from '../../util';
import { ActionList, ContextList } from '@automationcloud/engine';

export class FlowCutCommand extends FlowDeleteCommand {
    dataType: string = '';

    static title = 'Cut';

    protected async apply() {
        const list = this.viewport.getSelectedList()!;
        this.dataType = list instanceof ActionList ? 'actions' : list instanceof ContextList ? 'contexts' : 'unknown';
        await super.apply();
        clipboard.writeObject({
            type: this.dataType,
            data: this.removedSpecs,
        });
    }
}
