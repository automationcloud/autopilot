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

import { clamp, util } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';

import { controller } from '../controller';
import { UserData } from '../userdata';
import { LayoutDirection, LayoutItem } from '../util/layout-item';
import { Viewport } from '../viewport';
import { EventsController } from './events';
import { StorageController } from './storage';
import { WelcomeController } from './welcome';

@injectable()
@controller({ alias: 'layout' })
export class LayoutController {
    userData: UserData;

    root!: LayoutItem;
    workspaces!: LayoutWorkspace[];
    activeWorkspaceIndex: number = 0;

    activeViewportId: string = '';
    draggingItem: LayoutItem | null = null;

    constructor(
        @inject(StorageController)
        storage: StorageController,
        @inject(EventsController)
        protected events: EventsController,
        @inject('viewports')
        protected viewports: { [key: string]: Viewport<any> },
        @inject(WelcomeController)
        protected welcome: WelcomeController,
    ) {
        this.userData = storage.createUserData('layout', 500);
    }

    async init() {
        const { workspaces, activeWorkspaceIndex = 0 } = await this.userData.loadData();
        if (workspaces == null) {
            this.welcome.setShown(true);
        }
        this.workspaces = workspaces ?? DEFAULT_WORKSPACES;
        this.cleanupWorkspaces();
        this.activeWorkspaceIndex = clamp(activeWorkspaceIndex, 0, this.workspaces.length - 1);
        const layout = this.workspaces[this.activeWorkspaceIndex]?.layout ?? DEFAULT_WORKSPACES[0].layout;
        this.root = new LayoutItem(null, layout);
        this.activateCycle();
    }

    protected update() {
        this.root.repack();
        this.syncActiveWorkspace();
        this.userData.update({
            workspaces: this.workspaces,
            activeWorkspaceIndex: this.activeWorkspaceIndex,
        });
    }

    protected syncActiveWorkspace() {
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
            this.activateViewport(firstViewport.viewportId);
        }
        this.update();
    }

    activateInternalWorkspace(layout: any) {
        this.activeWorkspaceIndex = -1;
        this.root = new LayoutItem(null, layout);
        const firstViewport = this.root.getFirstViewport();
        if (firstViewport && firstViewport.viewportId) {
            this.activateViewport(firstViewport.viewportId);
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
            .map(i => this.viewports[i.viewportId!]!)
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
        this.update();
    }

    moveOnto(target: LayoutItem, itemToMove: LayoutItem, dir: LayoutDirection) {
        itemToMove.moveOnto(target, dir);
        this.update();
    }

    remove(itemToRemove: LayoutItem) {
        itemToRemove.removeSelf();
        this.update();
    }


    isViewportActive(viewportId: string) {
        return this.activeViewportId === viewportId;
    }

    getActiveViewport(): Viewport<any> | null {
        const visible = this.findByViewportId(this.activeViewportId) != null;
        return visible ? this.viewports[this.activeViewportId] : null;
    }

    activateViewport(viewportId: string) {
        if (this.activeViewportId === viewportId) {
            return;
        }
        this.activateWorkspaceForViewport(viewportId);
        this.activeViewportId = viewportId;
        this.events.emit('activeViewportChanged');
        this.focusActiveViewport();
    }

    activateInDirection(dir: LayoutDirection) {
        const activeViewportItem = this.findByViewportId(this.activeViewportId);
        if (!activeViewportItem) {
            return;
        }
        const nextViewport = activeViewportItem.getViewportInDirection(dir);
        if (nextViewport) {
            this.activateViewport(nextViewport.viewportId!);
        }
    }

    activateCycle(forward: boolean = true) {
        const visibleIds = this.getViewportIds();
        const i = visibleIds.indexOf(this.activeViewportId);
        const newIndex = ((forward ? i + 1 : i - 1) + visibleIds.length) % visibleIds.length;
        this.activateViewport(visibleIds[newIndex]);
    }

    focusActiveViewport(force: boolean = false) {
        const viewport = this.getActiveViewport();
        if (!viewport) {
            return;
        }
        viewport.focus(force);
    }

    /**
     * Removes the workspaces that don't contain any viewports.
     */
    protected cleanupWorkspaces() {
        this.workspaces = this.workspaces.filter(workspace => {
            const layout = new LayoutItem(null, workspace.layout);
            const viewports = [...layout.root().searchByType('viewport')]
                .filter(_ => this.viewports[_.viewportId!] != null);
            return viewports.length > 0;
        });
    }

    protected activateWorkspaceForViewport(viewportId: string) {
        const viewportItem = this.findByViewportId(viewportId);
        if (!viewportItem) {
            const workspaceIndex = this.findWorkspaceByViewport(viewportId);
            if (workspaceIndex > -1) {
                this.activateWorkspace(workspaceIndex);
            }
        }
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
