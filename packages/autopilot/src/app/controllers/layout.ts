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
import { inject, injectable } from 'inversify';
import { controller } from '../controller';
import { ViewportManager } from '../managers/viewport-manager';
import { UserData } from '../userdata';
import { LayoutDirection, LayoutItem } from '../util/layout-item';
import { Viewport } from '../viewport';
import { StorageController } from './storage';

@controller()
@injectable()
export class LayoutController {
    userData: UserData;

    root!: LayoutItem;
    workspaces!: LayoutWorkspace[];
    activeWorkspaceIndex: number = 0;

    draggingItem: LayoutItem | null = null;

    constructor(
        @inject(StorageController)
        storage: StorageController,
        @inject(ViewportManager)
        protected viewports: ViewportManager,
    ) {
        this.userData = storage.createUserData('layout', 500);
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
            this.viewports.activate(firstViewport.viewportId);
        }
        this.update();
    }

    activateInternalWorkspace(layout: any) {
        this.activeWorkspaceIndex = -1;
        this.root = new LayoutItem(null, layout);
        const firstViewport = this.root.getFirstViewport();
        if (firstViewport && firstViewport.viewportId) {
            this.viewports.activate(firstViewport.viewportId);
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
            .map(i => this.viewports.get(i.viewportId!)!)
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

export interface LayoutWorkspace {
    name: string;
    layout: any;
}

const DEFAULT_WORKSPACES: LayoutWorkspace[] = [
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
        name: 'Inputs',
        layout: { type: 'viewport', viewportId: 'bundles' },
    },
    {
        name: '❔',
        layout: { type: 'viewport', viewportId: 'help-resources' },
    },
];
