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

import { model } from '@automationcloud/engine';

import { Command } from '../../command';
import { ScriptFlowViewport } from '.';

export class CreateActionsCommand extends Command<ScriptFlowViewport> {
    newSpecs: any[];
    listPath: string = '';
    specs: any[] | null = null;
    ids: string[] = [];

    static title = 'Create Actions';

    constructor(viewport: ScriptFlowViewport, newSpecs: any[]) {
        super(viewport);
        this.newSpecs = newSpecs;
    }

    isUndoable() {
        return true;
    }

    canExecute() {
        return this.viewport.getActionInsertLocation() != null;
    }

    protected async apply() {
        const location = this.viewport.getActionInsertLocation()!;
        this.listPath = location.list.$path;
        this.ids = [];
        // Only grab from clipboard initially; for Redo grab from local state
        const data = this.specs == null ? this.newSpecs : this.specs;
        const specs = data == null ? [] : Array.isArray(data) ? data : [data];
        this.specs = specs;

        this.viewport.clearSelection();
        let idx = location.index;
        for (const spec of specs) {
            const item = location.list.insert(spec, idx);
            idx += 1;
            this.ids.push(item.id);
            this.viewport.addToSelection(item);
        }
        this.app.project.update();
    }

    protected async unapply() {
        const list = this.script.get(this.listPath);
        if (!(list instanceof model.EntityList)) {
            return this.throw('Cannot undo: illegal command state');
        }
        list.removeWhere(_ => this.ids.includes(_.id));
        this.app.project.update();
    }
}
