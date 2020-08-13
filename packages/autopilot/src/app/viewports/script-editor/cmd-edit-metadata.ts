import { ScriptEditorViewport } from '.';
import { ScriptEditorCommand } from './cmd';

export class EditMetadataCommand extends ScriptEditorCommand {
    key: string;
    oldValue: any;
    newValue: any;

    static title = 'Edit Service';

    constructor(viewport: ScriptEditorViewport, key: string, value: any) {
        super(viewport);
        this.key = key;
        this.newValue = value;
    }

    get service() {
        return this.app.project.metadata;
    }

    isUndoable() {
        return true;
    }

    canExecute() {
        return true;
    }

    append(cmd: EditMetadataCommand): boolean {
        if (cmd.key === this.key) {
            this.oldValue = cmd.oldValue;
            return true;
        }
        return false;
    }

    protected async apply() {
        this.oldValue = (this.service as any)[this.key];
        (this.service as any)[this.key] = this.newValue;
        this.app.project.update();
        this.app.events.emit('serviceUpdated');
    }

    protected async unapply() {
        (this.service as any)[this.key] = this.oldValue;
        this.app.project.update();
        this.app.events.emit('serviceUpdated');
    }
}
