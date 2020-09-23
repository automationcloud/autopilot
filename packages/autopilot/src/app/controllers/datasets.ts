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

import { controller } from '../controller';
import { injectable, inject } from 'inversify';
import { StorageController } from './storage';
import { UserData } from '../userdata';
import { helpers } from '../util';
import { util, clamp } from '@automationcloud/engine';

export interface Dataset {
    name: string;
    inputs: DatasetInput[];
    excluded?: boolean;
}

export interface DatasetInput {
    key: string;
    stage: string;
    data: any;
}

@injectable()
@controller({ backgroundInit: true })
export class DatasetsController {
    userData: UserData;

    datasets: Dataset[] = [];
    _currentIndex: number = 0;

    constructor(
        @inject(StorageController)
        storage: StorageController,
    ) {
        this.userData = storage.createUserData('datasets', 500);
    }

    async init() {
        const { datasets = [], currentIndex = 0 } = await this.userData.loadData();
        this.datasets = datasets.filter(Boolean);
        this._currentIndex = Number(currentIndex) || 0;
    }

    update() {
        this.userData.update({
            datasets: this.datasets,
            currentIndex: this._currentIndex,
        });
    }

    get currentIndex() {
        return clamp(this._currentIndex || 0, 0, this.datasets.length - 1);
    }

    loadDatasets(datasets: Dataset[]) {
        this.datasets = util.deepClone(datasets).filter(Boolean);
        this.update();
    }

    getCurrentDataset(): Dataset {
        if (!this.datasets.length) {
            this.datasets.push({
                name: 'Input data',
                inputs: [],
                excluded: false,
            });
            this._currentIndex = 0;
            this.update();
        }
        const current = this.datasets[this.currentIndex];
        return current;
    }

    selectDataset(index: number = this.datasets.length - 1) {
        this._currentIndex = index;
        this.update();
    }

    createDataset(
        spec: Dataset = {
            name: 'New dataset',
            inputs: [],
            excluded: false,
        },
    ) {
        this.datasets.push(spec);
        this.selectDataset(this.datasets.length - 1);
    }

    deleteCurrentDataset() {
        this.datasets.splice(this.currentIndex, 1);
        this.update();
    }

    findInput(key: string, stage: string): DatasetInput | null {
        const { inputs } = this.getCurrentDataset();
        return inputs.find(i => i.key === key && i.stage === stage) ?? null;
    }

    getInputKeys(): string[] {
        const { inputs } = this.getCurrentDataset();
        const keys: Set<string> = new Set();
        for (const input of inputs) {
            keys.add(input.key);
        }
        return Array.from(keys);
    }

    getInputData(key: string, stage: string, required: boolean = true): any {
        const input = this.findInput(key, stage);
        if (!input && required) {
            throw new Error(`Input ${key} not found. Use "Data" tab to define test input data.`);
        }
        return input?.data ?? null;
    }

    collectInputPaths() {
        const { inputs } = this.getCurrentDataset();
        const obj: any = {};
        for (const { key, stage, data } of inputs) {
            if (!stage) {
                obj[key] = data;
            }
        }
        return helpers.collectPointers(obj).map(_ => _.path);
    }

}
