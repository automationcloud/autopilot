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
import { UserData } from '../userdata';
import { StorageController } from './storage';

@injectable()
@controller({ alias: 'expandable', backgroundInit: true })
export class ExpandableController {
    userData: UserData;

    expandedIds: string[] = [];
    expandedSet: Set<string> = new Set();

    constructor(
        @inject(StorageController)
        protected storage: StorageController,
    ) {
        this.userData = storage.createUserData('expandable', 500);
    }

    async init() {
        const { expandedIds = [] } = await this.userData.loadData();
        this.expandedIds = expandedIds;
        this.expandedSet = new Set(expandedIds);
    }

    update() {
        this.expandedIds = [...this.expandedSet];
        this.userData.update({
            expandedIds: this.expandedIds,
        });
    }

    isExpanded(id: string) {
        return this.expandedIds && this.expandedSet.has(id);
    }

    expand(id: string) {
        this.expandedSet.add(id);
        this.update();
    }

    collapse(id: string) {
        this.expandedSet.delete(id);
        this.update();
    }

    toggleExpand(id: string) {
        if (this.isExpanded(id)) {
            this.collapse(id);
        } else {
            this.expand(id);
        }
    }

    collapseAll() {
        this.expandedSet.clear();
        this.update();
    }
}
