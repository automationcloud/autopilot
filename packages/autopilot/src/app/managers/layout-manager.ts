// Copyright 2020 Ubio Limited
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

import { App } from '../app';
import { UserData } from '../userdata';
import { EventEmitter } from 'events';
import { Viewport } from '../viewport';
import { util } from '@automationcloud/engine';

export interface LayoutWorkspace {
    name: string;
    layout: any;
}

export class LayoutManager extends EventEmitter {
    app: App;
    userData: UserData;

    root!: LayoutItem;
    workspaces!: LayoutWorkspace[];
    activeWorkspaceIndex: number = 0;

    draggingItem: LayoutItem | null = null;

    constructor(app: App) {
        super();
        this.app = app;
        this.userData = app.storage.createUserData('layout', 500);
    }

    async init() {
        const { root, workspaces = DEFAULT_WORKSPACES, activeWorkspaceIndex = 0 } = await this.userData.loadData();
        this.workspaces = workspaces;
        this.activeWorkspaceIndex = activeWorkspaceIndex;
        this.root = new LayoutItem(null, root || workspaces[activeWorkspaceIndex].layout);
    }

    update() {
        this.syncActiveWorkspace();
        this.userData.update({
            root: this.root,
            workspaces: this.workspaces,
            activeWorkspaceIndex: this.activeWorkspaceIndex,
        });
    }

    syncActiveWorkspace() {
        const workspace = this.workspaces[this.activeWorkspaceIndex];
        if (workspace) {
            workspace.layout = util.deepClone(this.root);
        }
    }

    activateWorkspace(index: number) {
        this.activeWorkspaceIndex = index;
        const workspace = this.workspaces[this.activeWorkspaceIndex];
        if (workspace) {
            this.root = new LayoutItem(null, workspace.layout);
        }
        const firstViewport = this.root.getFirstViewport();
        if (firstViewport && firstViewport.viewportId) {
            this.app.viewports.activate(firstViewport.viewportId);
        }
        this.update();
    }

    activateInternalWorkspace(layout: any) {
        this.activeWorkspaceIndex = -1;
        this.root = new LayoutItem(null, layout);
        const firstViewport = this.root.getFirstViewport();
        if (firstViewport && firstViewport.viewportId) {
            this.app.viewports.activate(firstViewport.viewportId);
        }
        this.update();
    }

    addWorkspace() {
        this.workspaces.push({
            name: 'New Workspace',
            layout: {
                type: 'viewport',
                viewportId: null,
            },
        });
        this.activateWorkspace(this.workspaces.length - 1);
    }

    removeWorkspace(i: number) {
        this.workspaces.splice(i, 1);
        this.activateWorkspace(i > 0 ? i - 1 : 0);
    }

    createDetachedItem(spec: any): LayoutItem {
        return new LayoutItem(null, spec);
    }

    findWorkspaceByViewport(viewportId: string): number {
        return this.workspaces.findIndex(w => {
            const l = new LayoutItem(null, w.layout);
            for (const viewportItem of l.searchByType('viewport')) {
                if (viewportItem.viewportId === viewportId) {
                    return true;
                }
            }
            return false;
        });
    }

    findByViewportId(viewportId: string): LayoutItem | null {
        for (const viewportItem of this.root.searchByType('viewport')) {
            if (viewportItem.viewportId === viewportId) {
                return viewportItem;
            }
        }
        return null;
    }

    getViewports(): Array<Viewport<any>> {
        return this.getViewportItems()
            .map(i => this.app.viewports.get(i.viewportId!)!)
            .filter(Boolean);
    }

    getViewportItems(): LayoutItem[] {
        return [...this.root.searchByType('viewport')];
    }

    getViewportIds(): string[] {
        return this.getViewportItems()
            .map(_ => _.viewportId || '')
            .filter(Boolean);
    }

    split(target: LayoutItem, newItem: LayoutItem, dir: LayoutDirection) {
        target.splitWith(newItem, dir);
        this.root.repack();
        this.update();
    }

    moveOnto(target: LayoutItem, itemToMove: LayoutItem, dir: LayoutDirection) {
        itemToMove.moveOnto(target, dir);
        this.root.repack();
        this.update();
    }

    remove(itemToRemove: LayoutItem) {
        itemToRemove.removeSelf();
        this.root.repack();
        this.update();
    }
}

export type LayoutItemType = 'viewport' | 'row' | 'column';
export type LayoutDirection = 'left' | 'right' | 'top' | 'bottom';

/**
 * Low level operations for layout management (move, reorder, etc.)
 */
class LayoutItem {
    $parent!: LayoutItem | null;
    type: 'viewport' | 'row' | 'column';
    size: number = 0.5;
    children: LayoutItem[];
    viewportId: string | null = null;

    constructor($parent: LayoutItem | null, spec: any) {
        Object.defineProperties(this, {
            $parent: {
                value: $parent,
                enumerable: false,
                writable: true,
            },
        });

        const { type, size = 0.5, children = [], viewportId = null } = spec;
        this.type = type;
        this.size = size;
        this.children = children.map((c: any) => new LayoutItem(this, c));
        this.viewportId = viewportId;
        this.repack();
    }

    root(): LayoutItem {
        if (!this.$parent) {
            return this;
        }
        return this.$parent.root();
    }

    contains(item: LayoutItem): boolean {
        if (this === item) {
            return true;
        }
        return this.children.some(c => c.contains(item));
    }

    removeChild(child: LayoutItem) {
        const index = this.children.findIndex(c => c === child);
        if (index > -1) {
            this.children.splice(index, 1);
        }
    }

    removeSelf() {
        if (this.$parent) {
            this.$parent.removeChild(this);
        }
    }

    canMove(onto: LayoutItem) {
        return this.$parent && !this.contains(onto);
    }

    moveOnto(onto: LayoutItem, dir: LayoutDirection) {
        if (!this.canMove(onto)) {
            throw new Error('Cannot move LayoutItem to specified location');
        }
        this.$parent!.removeChild(this);
        onto.splitWith(this, dir);
    }

    splitWith(neighbour: LayoutItem, dir: LayoutDirection) {
        const clone = new LayoutItem(this, {
            type: this.type,
            children: this.children,
            viewportId: this.viewportId,
            size: 0.5,
        });
        const isColumn = dir === 'top' || dir === 'bottom';
        const isFirst = dir === 'top' || dir === 'left';
        this.type = isColumn ? 'column' : 'row';
        this.children = isFirst ? [neighbour, clone] : [clone, neighbour];
        this.viewportId = null;
        neighbour.$parent = this;
    }

    repack(): void {
        if (this.type === 'viewport') {
            this.children = [];
            return;
        }
        this.viewportId = null;
        // Collapse single-child containers
        if (this.children.length === 1) {
            const child = this.children[0];
            this.type = child.type;
            this.children = child.children;
            this.viewportId = child.viewportId;
            for (const c of this.children) {
                c.$parent = this;
            }
            this.repack();
            return;
        }
        // Collapse row{A, row{B, C}, D} into row{A, B, C, D}
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child.type === this.type) {
                const children = child.children;
                children.forEach(c => {
                    c.size *= child.size;
                    c.$parent = this;
                });
                this.children.splice(i, 1, ...children);
                // start over
                i = 0;
            }
        }
        // Normalize children sizes
        const total = this.children.reduce((sum, c) => sum + c.size, 0);
        for (const child of this.children) {
            if (total > 0) {
                child.size = child.size / total;
            }
            child.repack();
        }
    }

    *searchByType(type: LayoutItemType): IterableIterator<LayoutItem> {
        if (this.type === type) {
            yield this;
        }
        for (const child of this.children) {
            yield* child.searchByType(type);
        }
    }

    getFirstViewport(): LayoutItem | null {
        return this.searchByType('viewport').next().value || null;
    }

    /**
     * Returns a viewport located in specified direction from current one.
     * This function is recursive, because it delegates to ancestors to find the
     * appropriate viewport.
     * It maps to keyboard navigation UX, with `dir` corresponding to arrow keys.
     */
    getViewportInDirection(dir: LayoutDirection, childIndex: number = 0): LayoutItem | null {
        const type = dir === 'left' || dir === 'right' ? 'row' : 'column';
        // When left/right direction requested, look for nearest ancestor row
        // When top/bottom direction requested, look for nearest ancestor column
        // If we find it, we then move to next/previous sibling (if it exists)
        // and return the first viewport found in there.
        if (this.type === type) {
            const index = dir === 'left' || dir === 'top' ? childIndex - 1 : childIndex + 1;
            const sibling = this.children[index];
            if (sibling) {
                // Find first viewport there and return it
                const v = sibling.getFirstViewport();
                if (v) {
                    return v;
                }
            }
        }
        // Search up the hierarchy
        if (this.$parent) {
            const i = this.$parent.children.indexOf(this);
            return this.$parent.getViewportInDirection(dir, i);
        }
        return null;
    }
}

const DEFAULT_WORKSPACES = [
    {
        name: 'Script',
        layout: {
            type: 'row',
            children: [
                { type: 'viewport', viewportId: 'script-flow' },
                { type: 'viewport', viewportId: 'script-editor' },
            ],
        },
    },
    {
        name: 'Input',
        layout: { type: 'viewport', viewportId: 'datasets' },
    },
    {
        name: 'Automation Cloud',
        layout: { type: 'viewport', viewportId: 'api' },
    },
];
