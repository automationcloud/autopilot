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

import { FrequentItemController } from '../../controllers/frequent-item';
import { helpers } from '../../util';
import { ScriptEditorViewport } from '.';
import { ChangePipeTypeCommand } from './cmd-change-pipe-type';
import { CopyPipeCommand } from './cmd-copy-pipes';
import { CreatePipeCommand } from './cmd-create-pipe';
import { CutPipeCommand } from './cmd-cut-pipes';
import { DeletePipeCommand } from './cmd-delete-pipe';
import { EditActionCommand } from './cmd-edit-action';
import { EditContextCommand } from './cmd-edit-context';
import { EditMetadataCommand } from './cmd-edit-metadata';
import { EditPipeCommand } from './cmd-edit-pipe';
import { EditScriptCommand } from './cmd-edit-script';
import { InsertPipeRecipeCommand } from './cmd-insert-recipe';
import { PastePipeCommand } from './cmd-paste-pipe';

export class ScriptEditorCommandsController {
    viewport: ScriptEditorViewport;

    constructor(viewport: ScriptEditorViewport) {
        this.viewport = viewport;
    }

    private get frequentItems() {
        return this.viewport.app.get(FrequentItemController);
    }

    async editMetadata(key: string, newValue: any) {
        const cmd = new EditMetadataCommand(this.viewport, key, newValue);
        await cmd.execute();
    }

    async editScript(key: string, newValue: any) {
        const cmd = new EditScriptCommand(this.viewport, key, newValue);
        await cmd.execute();
    }

    async editContext(path: string, key: string, newValue: any) {
        const cmd = new EditContextCommand(this.viewport, path, key, newValue);
        await cmd.execute();
    }

    async editAction(path: string, key: string, newValue: any) {
        const cmd = new EditActionCommand(this.viewport, path, key, newValue);
        await cmd.execute();
    }

    async editPipe(path: string, key: string, newValue: any) {
        const cmd = new EditPipeCommand(this.viewport, path, key, newValue);
        await cmd.execute();
    }

    canCreatePipe() {
        return new CreatePipeCommand(this.viewport, {}).canExecute();
    }

    async createPipe(spec: any) {
        const cmd = new CreatePipeCommand(this.viewport, spec);
        await cmd.execute();
        this.frequentItems.onPipeCreate(spec.type);
    }

    async createComposeFromJson(json: object) {
        const mappings = helpers.createComposeMappings(json);
        const cmd = new CreatePipeCommand(this.viewport, {
            type: 'value/compose',
            mappings,
        });
        await cmd.execute();
    }

    canChangePipeType() {
        return new ChangePipeTypeCommand(this.viewport, {}).canExecute();
    }

    async changePipeType(spec: any) {
        const cmd = new ChangePipeTypeCommand(this.viewport, spec);
        await cmd.execute();
    }

    canCutPipes() {
        return new CutPipeCommand(this.viewport).canExecute();
    }

    async cutPipes() {
        const cmd = new CutPipeCommand(this.viewport);
        await cmd.execute();
    }

    canCopyPipes() {
        return new CopyPipeCommand(this.viewport).canExecute();
    }

    async copyPipes() {
        const cmd = new CopyPipeCommand(this.viewport);
        await cmd.execute();
    }

    canPastePipes() {
        return new PastePipeCommand(this.viewport).canExecute();
    }

    async pastePipes() {
        const cmd = new PastePipeCommand(this.viewport);
        await cmd.execute();
    }

    canDeletePipes() {
        return new DeletePipeCommand(this.viewport).canExecute();
    }

    async deletePipes() {
        const cmd = new DeletePipeCommand(this.viewport);
        await cmd.execute();
    }

    async insertPipeRecipe(specs: any[]) {
        const cmd = new InsertPipeRecipeCommand(this.viewport, specs);
        await cmd.execute();
    }
}
