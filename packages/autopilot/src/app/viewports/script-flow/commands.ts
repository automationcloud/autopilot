import { CreateContextCommand } from './cmd-create-context';
import { FlowCopyCommand } from './cmd-copy';
import { FlowCutCommand } from './cmd-cut';
import { FlowPasteCommand } from './cmd-paste';
import { FlowDeleteCommand } from './cmd-delete';
import { CreateActionsCommand } from './cmd-create-actions';
import { ResetCommand } from './cmd-reset';
import { ChangeActionTypeCommand } from './cmd-change-action-type';
import { ContextType } from '@automationcloud/engine';
import { ScriptFlowViewport } from '.';

export class ScriptFlowCommandsController {
    viewport: ScriptFlowViewport;

    constructor(viewport: ScriptFlowViewport) {
        this.viewport = viewport;
    }

    canCreateAnything() {
        // Create command relies on list being selected
        return this.viewport.getSelectedList() != null;
    }

    canCreateContext(type: ContextType) {
        if (type === 'checkpoint') {
            if (this.viewport.script.getCheckpointContext()) {
                return false;
            }
        }
        return new CreateContextCommand(this.viewport).canExecute();
    }

    async createContext(type: ContextType) {
        const cmd = new CreateContextCommand(this.viewport, type);
        await cmd.execute();
    }

    canCreateAction() {
        return new CreateActionsCommand(this.viewport, []).canExecute();
    }

    async createAction(spec: any) {
        const cmd = new CreateActionsCommand(this.viewport, [spec]);
        await cmd.execute();
    }

    async createActions(specs: any[]) {
        const cmd = new CreateActionsCommand(this.viewport, specs);
        await cmd.execute();
    }

    canChangeActionType() {
        return new ChangeActionTypeCommand(this.viewport, {}).canExecute();
    }

    async changeActionType(spec: any) {
        const cmd = new ChangeActionTypeCommand(this.viewport, spec);
        await cmd.execute();
    }

    canCut() {
        return new FlowCutCommand(this.viewport).canExecute();
    }

    async cut() {
        const cmd = new FlowCutCommand(this.viewport);
        await cmd.execute();
    }

    canCopy() {
        return new FlowCopyCommand(this.viewport).canExecute();
    }

    async copy() {
        const cmd = new FlowCopyCommand(this.viewport);
        await cmd.execute();
    }

    canPaste() {
        return new FlowPasteCommand(this.viewport).canExecute();
    }

    async paste() {
        const cmd = new FlowPasteCommand(this.viewport);
        await cmd.execute();
    }

    canDelete() {
        return new FlowDeleteCommand(this.viewport).canExecute();
    }

    async delete() {
        const cmd = new FlowDeleteCommand(this.viewport);
        await cmd.execute();
    }

    canReset() {
        return new ResetCommand(this.viewport).canExecute();
    }

    async reset() {
        const cmd = new ResetCommand(this.viewport);
        await cmd.execute();
    }

}
