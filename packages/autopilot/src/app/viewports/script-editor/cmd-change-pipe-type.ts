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
