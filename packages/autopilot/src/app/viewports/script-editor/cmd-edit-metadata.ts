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

import { ScriptEditorViewport } from '.';
import { ScriptEditorCommand } from './cmd';

export class EditMetadataCommand extends ScriptEditorCommand {
    key: string;
    oldValue: any;
    newValue: any;

    static title = 'Edit Service';

    constructor(viewport: ScriptEditorViewport, key: string, value: any) {
        super(viewport);
        this.key = key;
        this.newValue = value;
    }

    get service() {
        return this.app.project.metadata;
    }

    isUndoable() {
        return true;
    }

    canExecute() {
        return true;
    }

    append(cmd: EditMetadataCommand): boolean {
        if (cmd.key === this.key) {
            this.oldValue = cmd.oldValue;
            return true;
        }
        return false;
    }

    protected async apply() {
        this.oldValue = (this.service as any)[this.key];
        (this.service as any)[this.key] = this.newValue;
        this.app.project.update();
        this.app.events.emit('serviceUpdated');
    }

    protected async unapply() {
        (this.service as any)[this.key] = this.oldValue;
        this.app.project.update();
        this.app.events.emit('serviceUpdated');
    }
}
