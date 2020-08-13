import { Command } from '../../command';
import { ScriptFlowViewport } from '.';
import { Action, util } from '@automationcloud/engine';

export class ChangeActionTypeCommand extends Command<ScriptFlowViewport> {
    newSpec: any;
    actionPath: string = '';
    oldSpec: any;

    static title = 'Change Action Type';

    constructor(viewport: ScriptFlowViewport, newSpec: any) {
        super(viewport);
        this.newSpec = newSpec;
    }

    isUndoable() {
        return true;
    }

    canExecute() {
        return this.getAction() != null;
    }

    protected async apply() {
        const action = this.getAction()!;
        this.actionPath = action.$path;
        this.oldSpec = util.deepClone(action);
        const spec: any = { ...util.deepClone(action), ...this.newSpec };
        action.$owner.replace(action, spec);
        this.app.project.update();
    }

    protected async unapply() {
        const action = this.script.get(this.actionPath);
        if (!(action instanceof Action)) {
            return this.throw('Cannot undo: illegal command state');
        }
        const spec = util.deepClone(this.oldSpec);
        action.$owner.replace(action, spec);
        this.app.project.update();
    }

    /**
     * Returns a single selected Action, not Matcher, not Definition,
     * to apply the command to — or `null` if the conditions not met.
     */
    getAction(): Action | null {
        const sel = this.viewport.getSelectedItems();
        if (sel.length !== 1) {
            return null;
        }
        const action = sel[0];
        if (action instanceof Action) {
            if (action.type !== 'matcher' && action.type !== 'definition') {
                return action;
            }
        }
        return null;
    }
}
