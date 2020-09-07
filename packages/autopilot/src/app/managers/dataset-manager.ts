import { App } from '../app';
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

export class DatasetManager {
    app: App;
    userData: UserData;

    datasets!: Dataset[];
    _currentIndex: number = 0;

    constructor(app: App) {
        this.app = app;
        this.userData = app.storage.createUserData('datasets', 500);
    }

    async init() {
        const { datasets = [], currentIndex = 0 } = await this.userData.loadData();
        this.datasets = datasets.filter(Boolean);
        this._currentIndex = currentIndex;
    }

    update() {
        this.userData.update({
            datasets: this.datasets,
            currentIndex: this._currentIndex,
        });
    }

    get currentIndex() {
        return clamp(this._currentIndex, 0, this.datasets.length - 1);
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
            this.update();
        }
        const index = Math.min(this.currentIndex, this.datasets.length - 1);
        const current = this.datasets[index];
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
