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

import { Script } from '@automationcloud/engine';

import { Viewport } from './viewport';

export interface CommandFactory<V extends Viewport<any>> {
    title: string;
    new (viewport: V, ...args: any[]): Command<V>;
}

export abstract class Command<V extends Viewport<any>> {
    viewport: V;
    connectedViewportsState: Map<string, any> = new Map();
    lastExecutedAt: number = 0;

    constructor(viewport: V) {
        this.viewport = viewport;
    }

    get app() {
        return this.viewport.app;
    }

    get script(): Script {
        return this.app.project.script;
    }

    get title(): string {
        return (this.constructor as CommandFactory<V>).title;
    }

    abstract isUndoable(): boolean;
    abstract canExecute(): boolean;
    protected abstract apply(): Promise<void>;
    protected abstract unapply(): Promise<void>;

    protected getConnectedViewports(): Array<Viewport<any>> {
        return [this.viewport];
    }

    append(_cmd: Command<V>): boolean {
        return false;
    }

    async execute() {
        if (!this.canExecute()) {
            return;
        }
        this.saveConnectedState();
        this.viewport.activateViewport();
        await this.apply();
        this.lastExecutedAt = Date.now();
        if (this.isUndoable()) {
            this.viewport.getCommandBuffer().registerNewCommand(this);
        }
        this.app.events.emit('commandExecuted', this);
        this.viewport.focus();
    }

    async executeUndo() {
        this.viewport.activateViewport();
        this.restoreConnectedState();
        await this.unapply();
        this.viewport.focus();
    }

    async executeRedo() {
        this.saveConnectedState();
        this.viewport.activateViewport();
        await this.apply();
        this.viewport.focus();
    }

    async saveConnectedState() {
        this.connectedViewportsState = new Map();
        for (const viewport of this.getConnectedViewports()) {
            this.connectedViewportsState.set(viewport.getViewportId(), viewport.getState());
        }
    }

    async restoreConnectedState() {
        for (const viewport of this.getConnectedViewports()) {
            const state = this.connectedViewportsState.get(viewport.getViewportId());
            viewport.applyState(state);
        }
    }

    protected throw(message: string, details: any = {}) {
        const err = new Error(message) as any;
        err.command = this;
        err.details = details;
        throw err;
    }

    protected shouldExpand() {
        return true;
    }
}
