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
import { Command } from '../../command';

export abstract class ScriptEditorCommand extends Command<ScriptEditorViewport> {
    getConnectedViewports() {
        return [this.app.viewports.scriptEditor, this.app.viewports.scriptFlow];
    }
}

interface EntityLike {
    id: string;
    $path: string;
    [key: string]: any;
}

export abstract class EditEntityCommand<T extends EntityLike> extends ScriptEditorCommand {
    path: string;
    key: string;
    oldValue: any = null;
    newValue: any = null;

    constructor(viewport: ScriptEditorViewport, path: string, key: string, value: any) {
        super(viewport);
        this.path = path;
        this.key = key;
        this.newValue = value;
    }

    abstract validateEntity(entity: T): boolean;

    getEntity(): T | null {
        const entity = this.script.get(this.path);
        return entity && this.validateEntity(entity) ? entity : null;
    }

    isUndoable() {
        return true;
    }

    canExecute() {
        return this.getEntity() != null;
    }

    append(cmd: EditEntityCommand<T>): boolean {
        if (cmd.path === this.path && cmd.key === this.key) {
            this.oldValue = cmd.oldValue;
            return true;
        }
        return false;
    }

    protected async apply() {
        const { key, newValue } = this;
        const entity = this.getEntity()!;
        this.oldValue = entity[key];
        (entity as any)[key] = newValue;
        if (this.shouldExpand()) {
            this.app.expandable.expand(entity.id);
        }
        this.app.project.update();
    }

    protected async unapply() {
        const entity = this.getEntity()!;
        if (!entity) {
            return this.throw('Cannot undo: illegal command state');
        }
        const { key, oldValue } = this;
        (entity as any)[key] = oldValue;
        if (this.shouldExpand()) {
            this.app.expandable.expand(entity.id);
        }
        this.app.project.update();
    }
}
