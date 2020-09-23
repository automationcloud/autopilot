// Copyright 2020 Ubio Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
