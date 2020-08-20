import { Context, Action, model, ActionList, ContextList, booleanConfig } from '@automationcloud/engine';
import { App } from '../../app';

import { MenuItemConstructorOptions } from 'electron';
import { ScriptSearchController } from './search';
import { ScriptFlowCommandsController } from './commands';
import { ScriptFlowMenusController } from './menus';
import { ActionRecorderController } from './recorder';
import { ScriptViewport, InsertLocation } from '../script-viewport';
import { DragAndDropActionsController } from './dnd-actions';
import { BreakpointsController } from './breakpoints';

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
    breakpoints: BreakpointsController;

    constructor(app: App) {
        super(app);
        this.search = new ScriptSearchController(this);
        this.commands = new ScriptFlowCommandsController(this);
        this.menus = new ScriptFlowMenusController(this);
        this.recorder = new ActionRecorderController(this);
        this.dndActions = new DragAndDropActionsController(this);
        this.breakpoints = new BreakpointsController(this);
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

    showBreakpointOptions(): boolean {
        if (this.isActionSelected()) {
            const selectedAction: Action = this.getLastSelectedItem() as Action;
            if (selectedAction.type !== 'matcher' && selectedAction.type !== 'definition') {
                return true;
            }
        }
        return false;
    }

    showSetBreakpoint(): boolean {
        if (this.getLastSelectedItem() instanceof Action) {
            const selectedAction: Action = this.getLastSelectedItem() as Action;
            if (!this.app.playback.breakpointIds.includes(selectedAction.id)) {
                return true;
            }
        }
        return false;
    }

    showRemoveBreakpoint(): boolean {
        if (this.getLastSelectedItem() instanceof Action) {
            const selectedAction: Action = this.getLastSelectedItem() as Action;
            if (this.app.playback.breakpointIds.includes(selectedAction.id)) {
                return true;
            }
        }
        return false;
    }

    showRemoveAllBreakpoints(): boolean {
        if (this.app.playback.breakpointIds.length > 0) {
            return true;
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
            this.app.ui.expandable.expand(item.id);
            item = item instanceof Action ? item.$parent : null;
        }
        super.revealSelected();
    }

    *getViewMenu(): IterableIterator<MenuItemConstructorOptions> {
        yield* this.menus.menuView();
    }

    showActionHelpModal(type: string) {
        this.app.ui.help.showActionHelpModal(type);
    }
    // UI Options

    isShowInsertLines() {
        return this.app.settings.get(UI_ACTION_INSERT_LINES);
    }

}
