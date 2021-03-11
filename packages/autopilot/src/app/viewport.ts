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

import { util } from '@automationcloud/engine';
import { MenuItemConstructorOptions } from 'electron';

import { App } from './app';
import { CommandBuffer } from './command-buffer';
import { UserData } from './userdata';
import { dom } from './util';

export abstract class Viewport<State> {
    private state: any = {};
    app: App;
    userData: UserData;
    commandBuffer: CommandBuffer;

    constructor(app: App) {
        this.app = app;
        const clusterId = 'viewport-' + this.getViewportId();
        this.userData = app.storage.createUserData(clusterId, 500);
        this.commandBuffer = new CommandBuffer(app);
    }

    abstract getViewportId(): string;
    abstract getViewportName(): string;
    abstract getViewportIcon(): string;
    abstract getDefaultState(): State;

    async init() {
        const state = await this.userData.loadData(this.getDefaultState());
        this.state = state;
    }

    update() {
        this.userData.update(this.state);
        this.app.events.emit('viewportUpdated', this);
    }

    isViewportActive(): boolean {
        return this.app.viewports.isActive(this.getViewportId());
    }

    activateViewport() {
        this.app.viewports.activate(this.getViewportId());
    }

    getState(): State {
        return this.state;
    }

    applyState(state: State) {
        this.state = util.deepClone(state);
        this.update();
    }

    getCommandBuffer(): CommandBuffer {
        return this.commandBuffer;
    }

    *getMenu(): Iterable<MenuItemConstructorOptions> {}
    *getEditMenu(): Iterable<MenuItemConstructorOptions> {}
    *getViewMenu(): Iterable<MenuItemConstructorOptions> {}

    getViewportDomElement(): HTMLElement | null {
        const el = document.querySelector(`[data-viewport-id="${this.getViewportId()}"]`) as HTMLElement;
        return el;
    }

    focus(_force: boolean = false) {}
}

export abstract class StatelessViewport extends Viewport<null> {
    async init() {}
    update() {}
    getDefaultState() {
        return null;
    }
}

export abstract class SelectionViewport<T, State> extends Viewport<State> {
    lastSelectedIndex: number = 0;

    abstract getSelectedItems(): T[];
    abstract addToSelection(item: T): void;
    abstract removeFromSelection(item: T): void;
    abstract clearSelection(): void;

    getLastSelectedItem(): T | null {
        const items = this.getSelectedItems();
        return items.slice(-1)[0] ?? null;
    }

    isSelected(item: T): boolean {
        const items = this.getSelectedItems();
        return items.includes(item);
    }

    selectItem(item: T) {
        this.clearSelection();
        this.addToSelection(item);
    }

    toggleSelectItem(item: T) {
        if (this.isSelected(item)) {
            this.removeFromSelection(item);
        } else {
            this.addToSelection(item);
        }
    }

    selectItems(items: T[]) {
        this.clearSelection();
        for (const item of items) {
            this.addToSelection(item);
        }
    }

    getSelectedDomElement(): HTMLElement | null {
        const base = this.getViewportDomElement();
        if (!base) {
            return null;
        }
        const el = base.querySelector('[data-selected="true"]') as HTMLElement;
        return el;
    }

    focus(force: boolean = false) {
        const viewportEl = this.getViewportDomElement();
        if (!viewportEl) {
            return;
        }
        // Don't move focus if it's an input field
        if (dom.isInputElement(document.activeElement)) {
            return;
        }
        // If the focus already there, don't move it
        if (!force && viewportEl.contains(document.activeElement)) {
            return;
        }
        // Focus first selected child OR the viewport itself
        const selectedEl = this.getSelectedDomElement();
        const elToFocus = selectedEl || viewportEl;
        elToFocus.focus();
    }

    revealSelected() {
        setTimeout(() => {
            const el = this.getSelectedDomElement();
            if (el) {
                (el as any).scrollIntoViewIfNeeded();
            }
        });
    }
}
