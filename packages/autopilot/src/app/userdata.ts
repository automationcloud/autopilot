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

import debounce from 'debounce-promise';

import { StorageController } from './controllers/storage';

export class UserData {
    clusterId: string;

    constructor(
        protected storage: StorageController,
        clusterId: string,
        debounceSave: number = 300
    ) {
        this.clusterId = clusterId;
        if (debounceSave) {
            const originalSaveData = this.saveData;
            this.saveData = debounce((data: any) => originalSaveData.call(this, data), debounceSave);
        }
    }

    update(data: any) {
        this.saveData(data).catch(err => console.warn(`Could not update user data ${this.clusterId}`, err));
    }

    async saveData(data: any) {
        await this.storage.saveData(this.clusterId, data);
        console.debug('Saved user data', this.clusterId);
    }

    async loadData(defaults: any = {}): Promise<any> {
        return await this.storage.loadData(this.clusterId, defaults);
    }
}
