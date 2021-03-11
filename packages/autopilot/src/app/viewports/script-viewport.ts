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

import { model } from '@automationcloud/engine';

import { SelectionViewport } from '../viewport';

export interface InsertLocation {
    list: model.EntityList<any, any>;
    index: number;
}

interface ScriptViewportState {
    path: string;
    indices: number[];
}

interface ScriptViewportItem {
    id: string;
    $index: number;
    $owner: model.Entity<any>;
}

/**
 * Encapsulates common conventions shared by ScriptFlowViewport and ScriptEditorViewport:
 *
 * - focus handling (via data-id attribute)
 * - selection handling, including "list selection" (where start of the list can be selected)
 * - selection (de)serialization
 */
export abstract class ScriptViewport<T extends ScriptViewportItem> extends SelectionViewport<T, ScriptViewportState> {
    abstract canSelectList(list: model.EntityList<any, any>): boolean;

    get script() {
        return this.app.project.script;
    }

    getDefaultState(): ScriptViewportState {
        return { path: '', indices: [] };
    }

    getSelectedItems(): T[] {
        const list = this.getSelectedList();
        if (!list) {
            return [];
        }
        const { indices } = this.getState();
        return indices
            .slice()
            .map(idx => list.get(idx))
            .filter(Boolean);
    }

    addToSelection(item: T) {
        if (!item.$owner) {
            return this.clearSelection();
        }
        const path = item.$owner.$path;
        const index = item.$index;
        const state = this.getState();
        if (state.path !== path) {
            this.applyState({ path, indices: [index] });
        } else {
            const idxSet = new Set(state.indices);
            idxSet.add(index);
            const newIndices = [...idxSet].sort((a, b) => (a > b ? 1 : -1));
            this.applyState({ path, indices: newIndices });
        }
        this.lastSelectedIndex = index;
    }

    removeFromSelection(item: T) {
        const state = this.getState();
        const path = item.$owner.$path;
        const index = item.$index;
        if (state.path !== path) {
            return;
        }
        const newIndices = state.indices.filter(_ => _ !== index);
        if (!newIndices.length) {
            return this.clearSelection();
        }
        this.applyState({ path, indices: newIndices });
    }

    clearSelection(): void {
        this.lastSelectedIndex = 0;
        this.applyState({ path: '', indices: [] });
    }

    getLastSelectionIndex(): number {
        const { indices } = this.getState();
        return indices.length ? indices.slice(-1)[0] : -1;
    }

    getSelectedList(): model.EntityList<any, any> | null {
        const { path = '' } = this.getState();
        const obj = this.script.get(path);
        if (this.canSelectList(obj)) {
            return obj;
        }
        return null;
    }

    isListHeadSelected(list: model.EntityList<any, any>): boolean {
        const { path, indices } = this.getState();
        return list.$path === path && indices.join('') === '-1';
    }

    selectListHead(list: model.EntityList<any, any>) {
        this.lastSelectedIndex = 0;
        this.applyState({
            path: list.$path,
            indices: [-1], // indicates "insert before first child" operation
        });
    }

    expandSelectionTo(item: T) {
        const list = this.getSelectedList();
        if (list !== item.$owner) {
            return this.selectItem(item);
        }
        const startIdx = Math.min(this.lastSelectedIndex, item.$index);
        const endIdx = Math.max(this.lastSelectedIndex, item.$index);
        for (let i = startIdx; i <= endIdx; i++) {
            this.addToSelection(list.get(i));
        }
    }
}
