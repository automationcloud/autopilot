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

import { booleanConfig } from '@automationcloud/engine';

import { App } from '../app';
import { UserData } from '../userdata';

const UI_SHOW_FREQUENT_ITEMS = booleanConfig('UI_SHOW_FREQUENT_ITEMS', true);

export class FrequentItemController {
    app: App;
    userData: UserData;

    actionsSortedByCount: FrequentItem[] = [];
    pipesSortedByCount: FrequentItem[] = [];

    constructor(app: App) {
        this.app = app;
        this.userData = app.storage.createUserData('frequent-items', 500);
    }

    async init() {
        const { actionsSortedByCount = [], pipesSortedByCount = [] } = await this.userData.loadData();
        this.actionsSortedByCount = actionsSortedByCount;
        this.pipesSortedByCount = pipesSortedByCount;
    }

    isShown() {
        return this.app.config.get(UI_SHOW_FREQUENT_ITEMS);
    }

    onActionCreate(type: string): void {
        const index = this.actionsSortedByCount.findIndex(_ => _.type === type);
        if (index < 0) {
            this.actionsSortedByCount.push({
                type,
                lastUsedAt: Date.now(),
                totalCount: 1,
            });
        } else {
            const record = this.actionsSortedByCount[index];
            record.lastUsedAt = Date.now();
            record.totalCount += 1;
            this.actionsSortedByCount.splice(index, 1, record);
        }

        this.actionsSortedByCount.sort((a, b) => b.totalCount - a.totalCount);
        this.saveData();
    }

    onPipeCreate(type: string): void {
        const index = this.pipesSortedByCount.findIndex(_ => _.type === type);
        if (index < 0) {
            this.pipesSortedByCount.push({
                type,
                lastUsedAt: Date.now(),
                totalCount: 1,
            });
        } else {
            const record = this.pipesSortedByCount[index];
            record.lastUsedAt = Date.now();
            record.totalCount += 1;
            this.pipesSortedByCount.splice(index, 1, record);
        }

        this.pipesSortedByCount.sort((a, b) => b.totalCount - a.totalCount);
        this.saveData();
    }

    getActionTypes(limit: number = 5): string[] {
        const actionMap = this.app.resolver.getActionIndex();
        const validActions = this.actionsSortedByCount
            .filter(record => {
                const action = actionMap.get(record.type);
                return action && action.$hidden !== true;
            })
            .slice(0, limit);

        return validActions.sort((a, b) => b.lastUsedAt - a.lastUsedAt).map(record => record.type);
    }

    getPipeTypes(limit: number = 5): string[] {
        const pipeMap = this.app.resolver.getPipeIndex();
        const validPipes = this.pipesSortedByCount.filter(record => pipeMap.has(record.type)).slice(0, limit);

        return validPipes.sort((a, b) => b.lastUsedAt - a.lastUsedAt).map(record => record.type);
    }

    protected saveData(): void {
        this.userData.saveData({
            actionsSortedByCount: this.actionsSortedByCount,
            pipesSortedByCount: this.pipesSortedByCount,
        });
    }
}

interface FrequentItem {
    type: string;
    lastUsedAt: number;
    totalCount: number;
}
