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

import { Pipeline } from '@automationcloud/engine';

import { ScriptEditorViewport } from '.';
import { ScriptEditorCommand } from './cmd';

export class CreatePipeCommand extends ScriptEditorCommand {
    newSpec: any;
    listPath: string = '';
    newId: string = '';

    static title = 'Create Pipe';

    constructor(viewport: ScriptEditorViewport, newSpec: any) {
        super(viewport);
        this.newSpec = newSpec;
    }

    isUndoable() {
        return true;
    }

    canExecute() {
        return this.viewport.getPipeInsertLocation() != null;
    }

    protected async apply() {
        const location = this.viewport.getPipeInsertLocation()!;
        const spec: any = { ...this.newSpec };
        this.listPath = location.list.$path;
        // Preserve id for undo/redo
        if (this.newId) {
            spec.id = this.newId;
        }
        const pipe = location.list.insert(spec, location.index);
        this.newId = pipe.id;
        this.viewport.selectItem(pipe);
        this.viewport.app.expandable.expand(pipe.id);
        this.app.project.update();
    }

    protected async unapply() {
        const list = this.script.get(this.listPath);
        if (!(list instanceof Pipeline)) {
            return this.throw('Cannot undo: illegal command state');
        }
        list.removeWhere(_ => _.id === this.newId);
        this.app.project.update();
    }
}
