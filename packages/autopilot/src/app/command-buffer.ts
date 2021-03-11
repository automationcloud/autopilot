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

import { App } from './app';
import { Command } from './command';
import { Viewport } from './viewport';

// A delay during which sequential commands may be merged into one.
const APPEND_THRESHOLD = 2000;

/**
 * Low-level operations for Undo/Redo.
 */
export class CommandBuffer {
    app: App;
    private commands: Array<Command<any>> = [];
    private index: number = 0;

    constructor(app: App) {
        this.app = app;
    }

    reset() {
        this.commands = [];
        this.index = 0;
    }

    canUndo() {
        return this.getLastCommand() != null;
    }

    canRedo() {
        return this.getFutureCommand() != null;
    }

    getLastCommand(): Command<any> | null {
        return this.commands[this.index] || null;
    }

    getFutureCommand(): Command<any> | null {
        return this.commands[this.index - 1] || null;
    }

    registerNewCommand(cmd: Command<any>) {
        // See if we can append this command to previous one
        const lastCmd = this.getLastCommand();
        const lastCmdRunAt = lastCmd ? lastCmd.lastExecutedAt : 0;
        const recent = Math.abs(lastCmdRunAt - cmd.lastExecutedAt) < APPEND_THRESHOLD;
        if (lastCmd && lastCmd.constructor === cmd.constructor && recent) {
            const append = cmd.append(lastCmd);
            if (append) {
                // Replace last command with this one
                this.commands.splice(0, this.index + 1, cmd);
                this.index = 0;
                return;
            }
        }
        // No append: truncate the "redo" stack
        this.commands.splice(0, this.index, cmd);
        this.index = 0;
    }

    async undo() {
        if (!this.canUndo()) {
            return;
        }
        const cmd = this.getLastCommand()!;
        if (this.restoreCmdViewport(cmd)) {
            return;
        }
        await cmd.executeUndo();
        this.index += 1;
        this.app.events.emit('undoExecuted');
    }

    async redo() {
        if (!this.canRedo()) {
            return;
        }
        const cmd = this.getFutureCommand()!;
        if (this.restoreCmdViewport(cmd)) {
            return;
        }
        await cmd.executeRedo();
        this.index -= 1;
        this.app.events.emit('redoExecuted');
    }

    restoreCmdViewport(cmd: Command<Viewport<any>>): boolean {
        if (cmd.viewport.isViewportActive()) {
            return false;
        }
        // UX: if different viewport was active during undo/redo,
        // then just activate the viewport and restore the state
        // without actually undoing/redoing
        cmd.restoreConnectedState();
        cmd.viewport.focus();
        return true;
    }
}
