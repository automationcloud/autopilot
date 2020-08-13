import { ScriptFlowViewport } from '.';
import { Action } from '@automationcloud/engine';

export class BreakpointsController {
    viewport: ScriptFlowViewport;
    actionPath: string = '';

    constructor(viewport: ScriptFlowViewport) {
        this.viewport = viewport;
    }

    get app() {
        return this.viewport.app;
    }

    setBreakpoint() {
        const action = this.getAction()!;
        this.actionPath = action.$path;
        this.app.playback.addBreakpoint(action.id);
    }

    removeBreakpoint() {
        const action = this.getAction()!;
        this.actionPath = action.$path;
        this.app.playback.removeBreakpoint(action.id);
    }

    removeAllBreakpoints() {
        this.app.playback.clearBreakpoints();
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
