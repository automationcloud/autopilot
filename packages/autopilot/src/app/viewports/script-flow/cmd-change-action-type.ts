// Copyright 2020 UBIO Limited
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
