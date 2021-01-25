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

import { Context, Action, model, ActionList, ContextList, booleanConfig } from '@automationcloud/engine';
import { App } from '../../app';

import { MenuItemConstructorOptions } from 'electron';
import { ScriptSearchController } from './search';
import { ScriptFlowCommandsController } from './commands';
import { ScriptFlowMenusController } from './menus';
import { ActionRecorderController } from './recorder';
import { ScriptViewport, InsertLocation } from '../script-viewport';
import { DragAndDropActionsController } from './dnd-actions';
import { PlaybackController } from '../../controllers/playback';
import { HelpController } from '../../controllers/help';

type ScriptFlowItem = Context | Action;

const UI_ACTION_INSERT_LINES = booleanConfig('UI_ACTION_INSERT_LINES', true);

/**
 * Maintains selection state and commands for Script Flow (aka Script Tree View).
 * Selections are represented by a pointer to EntityList
 * (e.g. script.contexts, context.matchers, context.children, action.children, etc.)
 * and an array of indices of items within that list.
 * This allows selecting "pseudo-elements" which can unambiguosly point to the start
 * of an empty list which are required for a number of inserting operations.
 */
export class ScriptFlowViewport extends ScriptViewport<ScriptFlowItem> {
    search: ScriptSearchController;
    commands: ScriptFlowCommandsController;
    menus: ScriptFlowMenusController;
    recorder: ActionRecorderController;
    dndActions: DragAndDropActionsController;

    constructor(app: App) {
        super(app);
        this.search = new ScriptSearchController(this);
        this.commands = new ScriptFlowCommandsController(this);
        this.menus = new ScriptFlowMenusController(this);
        this.recorder = new ActionRecorderController(this);
        this.dndActions = new DragAndDropActionsController(this);
        this.app.events.on('automationLoaded', () => this.commandBuffer.reset());
        this.search.performSearch();
    }

    get playback() {
        return this.app.get(PlaybackController);
    }

    getViewportId(): string {
        return 'script-flow';
    }

    getViewportName(): string {
        return 'Script';
    }

    getViewportIcon(): string {
        return 'fas fa-list-ul';
    }

    *getEditMenu(): IterableIterator<MenuItemConstructorOptions> {
        yield* this.menus.menuEdit();
    }

    canSelectList(list: model.EntityList<any, any>): boolean {
        return list instanceof ContextList || list instanceof ActionList;
    }

    isContextSelected(): boolean {
        return this.getLastSelectedItem() instanceof Context;
    }

    isActionSelected(): boolean {
        return this.getLastSelectedItem() instanceof Action;
    }

    isSendNetworkRequestActionSelected(): boolean {
        if (this.getLastSelectedItem() instanceof Action) {
            const selectedAction: Action = this.getLastSelectedItem() as Action;
            if (selectedAction.type === 'send-network-request') {
                return true;
            }
        }
        return false;
    }

    getContextInsertLocation(): InsertLocation | null {
        const contextsList = this.script.contexts;
        const list = this.getSelectedList();
        if (!list) {
            return { list: contextsList, index: this.script.contexts.length };
        }
        if (list instanceof ContextList) {
            // When context is selected, insert after it
            return { list, index: this.getLastSelectionIndex() + 1 };
        }
        return null;
    }

    getActionInsertLocation(): InsertLocation | null {
        const list = this.getSelectedList();
        if (list instanceof ActionList) {
            return { list, index: this.getLastSelectionIndex() + 1 };
        }
        return null;
    }

    revealSelected() {
        let item = this.getLastSelectedItem();
        while (item) {
            this.app.expandable.expand(item.id);
            item = item instanceof Action ? item.$parent : null;
        }
        super.revealSelected();
    }

    *getViewMenu(): IterableIterator<MenuItemConstructorOptions> {
        yield* this.menus.menuView();
    }

    showActionHelpModal(type: string) {
        this.app.get(HelpController).showActionHelpModal(type);
    }
    // UI Options

    isShowInsertLines() {
        return this.app.settings.get(UI_ACTION_INSERT_LINES);
    }

}
