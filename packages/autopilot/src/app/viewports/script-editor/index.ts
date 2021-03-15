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

import { Action, booleanConfig, Context, Element, model, Pipe, Pipeline } from '@automationcloud/engine';
import { MenuItemConstructorOptions } from 'electron';

import { App } from '../../app';
import { HelpController } from '../../controllers/help';
import { clipboard, helpers } from '../../util';
import { toCsv } from '../../util/csv';
import { InsertLocation, ScriptViewport } from '../script-viewport';
import { ScriptEditorCommandsController } from './commands';
import { ScriptEditorMenusController } from './menus';

const UI_PIPE_VERBOSE_FEEDBACK = booleanConfig('UI_PIPE_VERBOSE_FEEDBACK', true);
const UI_PIPE_INSERT_LINES = booleanConfig('UI_PIPE_INSERT_LINES', true);

export type EditorType = 'default' | 'nothing' | 'multiple' | 'action' | 'context';

export class ScriptEditorViewport extends ScriptViewport<Pipe> {
    commands: ScriptEditorCommandsController;
    menus: ScriptEditorMenusController;

    constructor(app: App) {
        super(app);
        this.commands = new ScriptEditorCommandsController(this);
        this.menus = new ScriptEditorMenusController(this);
        this.app.events.on('automationLoaded', () => this.commandBuffer.reset());
    }

    get feedback() {
        return this.app.ui.feedbacks;
    }

    getViewportId(): string {
        return 'scriptEditor';
    }

    getViewportName(): string {
        return 'Editor';
    }

    getViewportIcon(): string {
        return 'fas fa-pencil-alt';
    }

    getCommandBuffer() {
        return this.app.viewports.scriptFlow.getCommandBuffer();
    }

    *getEditMenu(): IterableIterator<MenuItemConstructorOptions> {
        yield* this.menus.menuEdit();
    }

    canSelectList(list: model.EntityList<any, any>): boolean {
        // Pipeline is only selectable within currently selected action
        const action = this.getSelectedAction();
        if (!action) {
            return false;
        }
        return list instanceof Pipeline && list.$action.id === action.id;
    }

    getSelectedContext(): Context | null {
        const item = this.app.viewports.scriptFlow.getLastSelectedItem();
        return item instanceof Context ? item : null;
    }

    getSelectedAction(): Action | null {
        const item = this.app.viewports.scriptFlow.getLastSelectedItem();
        return item instanceof Action ? item : null;
    }

    getEditorType(): EditorType {
        const list = this.app.viewports.scriptFlow.getSelectedList();
        if (!list) {
            return 'default';
        }
        const item = this.app.viewports.scriptFlow.getLastSelectedItem();
        if (item instanceof Context) {
            return 'context';
        } else if (item instanceof Action) {
            return 'action';
        }
        // When list pseudo is selected
        return 'nothing';
    }

    getPipeInsertLocation(): InsertLocation | null {
        const list = this.getSelectedList();
        if (list instanceof Pipeline) {
            return { list, index: this.getLastSelectionIndex() + 1 };
        }
        return null;
    }

    showPipeHelpModal(type: string) {
        this.app.get(HelpController).showPipeHelpModal(type);
    }

    // Edit Proxies
    // TODO consider caching them and invalidating on selection change
    // but only if there's an evidence of performance issues

    getScriptProxy(): any {
        return helpers.createEditProxy(this.script, (k, v) => this.commands.editScript(k, v));
    }

    getMetadataProxy(): any {
        return helpers.createEditProxy(this.app.project.automation.metadata, (k, v) => this.commands.editMetadata(k, v));
    }

    createContextProxy(context: Context): any {
        return helpers.createEditProxy(context, (k, v) => this.commands.editContext(context.$path, k, v));
    }

    createActionProxy(action: Action): any {
        return helpers.createEditProxy(action, (k, v) => this.commands.editAction(action.$path, k, v));
    }

    createPipeProxy(pipe: Pipe): any {
        return helpers.createEditProxy(pipe, (k, v) => this.commands.editPipe(pipe.$path, k, v));
    }

    // UI Options

    isShowVerboseFeedback() {
        return this.app.settings.get(UI_PIPE_VERBOSE_FEEDBACK);
    }

    isShowInsertLines() {
        return this.app.settings.get(UI_PIPE_INSERT_LINES);
    }

    // Extras

    copyPipeOutcomesAsJson(outcomes: Element[]) {
        const values = outcomes.map(el => el.value);
        clipboard.writeObject(values);
    }

    copyPipeOutcomesAsCsv(outcomes: Element[]) {
        const values = outcomes.map(el => el.value);
        const csv = toCsv(values);
        clipboard.writeText(csv);
    }
}
