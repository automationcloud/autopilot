import { inject, injectable } from 'inversify';

import { controller } from '../controller';
import { Bubble } from '../entities/bubble';
import { UserData } from '../userdata';
import { LayoutController } from './layout';
import { StorageController } from './storage';

const BUBBLES: Bubble[] = [
    {
        id: 'welcome-workspace',
        selector: `[data-anchor='workspace']`,
        orientation: 'top',
        alignment: 'start',
    },
    {
        id: 'welcome-script-flow',
        selector: `[data-anchor='viewport-scriptFlow-e']`,
        orientation: 'left',
        alignment: 'middle',
    },
    {
        id: 'welcome-script-editor',
        selector: `[data-anchor='viewport-scriptEditor-w']`,
        orientation: 'right',
        alignment: 'middle',
    },
    {
        id: 'welcome-playback',
        selector: `[data-anchor='playback']`,
        orientation: 'bottom',
        alignment: 'middle',
        class: 'bubble--wide',
    },
    {
        id: 'welcome-login',
        selector: `[data-anchor='login']`,
        orientation: 'top',
        alignment: 'end'
    },
    {
        id: 'welcome-play-script',
        selector: `[data-anchor='play-script']`,
        orientation: 'bottom',
        alignment: 'start',
        class: 'bubble--wide',
    }
];

@injectable()
@controller({ alias: 'bubbles' })
export class BubblesController {
    userData: UserData;
    shownIds: string[] = [];

    constructor(
        @inject(LayoutController)
        protected layout: LayoutController,
        @inject(StorageController)
        protected storage: StorageController,
    ) {
        this.userData = storage.createUserData('bubbles');
    }

    async init() {
        const { shownIds = [] } = await this.userData.loadData();
        this.shownIds = shownIds;
        // A hack to filter out the bubbles which are not part of the default layout
        if (!this.showScriptViewportBubble()) {
            this.shownIds.push('welcome-script-flow', 'welcome-script-editor');
            this.update();
        }
    }

    update() {
        this.userData.saveData({
            shownIds: this.shownIds,
        });
    }

    getAll() {
        return BUBBLES;
    }

    getRemaining() {
        return this.getAll().filter(_ => !this.shownIds.includes(_.id));
    }

    getCurrent() {
        return this.getRemaining()[0] ?? null;
    }

    remove(id: string) {
        const bubble = this.getAll().find(_ => _.id === id);
        if (!bubble) {
            return;
        }
        this.shownIds.push(id);
        this.update();
    }

    removeAll() {
        for (const bubble of [...this.getAll()]) {
            this.remove(bubble.id);
        }
    }

    protected showScriptViewportBubble() {
        const { layout } = this.layout.workspaces[this.layout.activeWorkspaceIndex];
        return layout.type === 'row' &&
            layout.children[0]?.viewportId === 'scriptFlow' &&
            layout.children[1]?.viewportId === 'scriptEditor';
    }

}
