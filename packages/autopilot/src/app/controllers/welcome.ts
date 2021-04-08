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
import { inject, injectable } from 'inversify';

import { controller } from '../controller';
import { Bubble } from '../entities/bubble';
import { UserData } from '../userdata';
import { BubblesController } from './bubbles';
import { LayoutController } from './layout';
import { SettingsController } from './settings';
import { StorageController } from './storage';

@injectable()
@controller({ alias: 'welcome' })
export class WelcomeController {
    userData: UserData;
    shownIds: string[] = [];
    viewportShown: boolean = true;

    constructor(
        @inject(SettingsController)
        protected settings: SettingsController,
        @inject(LayoutController)
        protected layout: LayoutController,
        @inject(StorageController)
        protected storage: StorageController,
        @inject(BubblesController)
        protected bubbles: BubblesController,
    ) {
        this.userData = storage.createUserData('welcome');
    }

    async init() {
        const { shownIds = [] } = await this.userData.loadData();
        this.shownIds = shownIds;
        if (!this.showScriptViewportBubble()) {
            this.shownIds.push('welcome-script-flow', 'welcome-script-editor');
            this.update();
        }
        const bubbles = this.contents
            .filter(_ => !shownIds.includes(_.id))
            .map(bubble => ({
                ...bubble,
                onRemove: () => { this.onMarkAsShown(bubble.id); }
            }));
        this.bubbles.addMany(bubbles);
    }

    update() {
        this.userData.saveData({
            shownIds: this.shownIds,
        });
    }

    showScriptViewportBubble() {
        const { layout } = this.layout.workspaces[this.layout.activeWorkspaceIndex];
        return layout.type === 'row' &&
            layout.children[0]?.viewportId === 'scriptFlow' &&
            layout.children[1]?.viewportId === 'scriptEditor';
    }

    onMarkAsShown(id: string) {
        this.shownIds.push(id);
        this.update();
    }

    get contents(): Bubble[] {
        return [
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
                alignment: 'middle'
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
                alignment: 'start'
            }
        ];
    }
}
