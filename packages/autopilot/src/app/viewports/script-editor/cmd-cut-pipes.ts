import { DeletePipeCommand } from './cmd-delete-pipe';
import { clipboard } from '../../util';

export class CutPipeCommand extends DeletePipeCommand {
    dataType: string = '';

    static title = 'Cut';

    protected async apply() {
        await super.apply();
        clipboard.writeObject({
            type: 'pipes',
            data: this.removedSpecs,
        });
    }
}
