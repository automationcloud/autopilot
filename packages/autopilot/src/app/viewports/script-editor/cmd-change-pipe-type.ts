import { Command } from '../../command';
import { ScriptEditorViewport } from '.';
import { Pipe, util } from '@automationcloud/engine';

export class ChangePipeTypeCommand extends Command<ScriptEditorViewport> {
    newSpec: any;
    pipePath: string = '';
    oldSpec: any = null;

    static title = 'Change Pipe Type';

    constructor(viewport: ScriptEditorViewport, newSpec: any) {
        super(viewport);
        this.newSpec = newSpec;
    }

    isUndoable() {
        return true;
    }

    canExecute() {
        return this.getPipe() != null;
    }

    protected async apply() {
        const pipe = this.getPipe()!;
        this.pipePath = pipe.$path;
        this.oldSpec = util.deepClone(pipe);
        const spec: any = { ...util.deepClone(pipe), ...this.newSpec };
        pipe.$owner.replace(pipe, spec);
        this.app.project.update();
    }

    protected async unapply() {
        const pipe = this.script.get(this.pipePath);
        if (!(pipe instanceof Pipe)) {
            return this.throw('Cannot undo: illegal command state');
        }
        const spec: any = util.deepClone(this.oldSpec);
        pipe.$owner.replace(pipe, spec);
        this.app.project.update();
    }

    getPipe(): Pipe | null {
        return this.viewport.getLastSelectedItem();
    }
}
