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

import { Command } from '../../command';
import { Pipeline, util } from '@automationcloud/engine';
import { ScriptEditorViewport } from '.';

export class DeletePipeCommand extends Command<ScriptEditorViewport> {
    listPath: string = '';
    removedIndices: number[] = [];
    removedSpecs: any[] = [];

    static title = 'Delete';

    isUndoable() {
        return true;
    }

    canExecute() {
        return this.viewport.getSelectedItems().length > 0;
    }

    protected async apply() {
        const list = this.viewport.getSelectedList()!;
        const items = this.viewport.getSelectedItems();
        // Indices will change when we'll delete, so we need to get the objects
        // Memorize indices and removed specs
        this.listPath = list.$path;
        this.removedIndices = [];
        this.removedSpecs = [];
        for (const item of items) {
            const spec = util.deepClone(item);
            this.removedIndices.push(item.$index);
            this.removedSpecs.push(spec);
            list.remove(item);
        }
        // Select child after last removed one, if it exists
        const idx = this.removedIndices.slice(-1)[0];
        const item = list.get(idx);
        if (item) {
            this.viewport.selectItem(item);
        } else {
            this.viewport.selectListHead(list);
        }
        this.app.project.update();
        this.app.viewports.focusActive();
    }

    protected async unapply() {
        const list = this.script.get(this.listPath);
        if (!(list instanceof Pipeline)) {
            console.error('Cannot undo: illegal command state', this);
            return;
        }
        if (this.removedIndices.length !== this.removedSpecs.length) {
            return this.throw('Cannot undo: illegal command state');
        }
        // Re-create in reverse order, otherwise indices are screwed
        const specs = this.removedSpecs.slice().reverse();
        const indices = this.removedIndices.slice().reverse();
        for (let i = 0; i < specs.length; i++) {
            const idx = indices[i];
            const spec = specs[i];
            list.insert(spec, idx);
        }
        this.app.project.update();
    }
}
