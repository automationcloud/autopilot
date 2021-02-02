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

import { controller } from '../controller';
import { injectable, inject } from 'inversify';
import { clipboard, helpers } from '../util';
import { clamp, ScriptInput } from '@automationcloud/engine';
import { ProjectController } from './project';
import { Bundle } from '../entities/bundle';
import { ExpandableController } from './expandable';
import { StorageController } from './storage';
import { promises as fs } from 'fs';

@injectable()
@controller({ alias: 'bundles' })
export class BundlesController {

    constructor(
        @inject(ProjectController)
        protected project: ProjectController,
        @inject(ExpandableController)
        protected expandable: ExpandableController,
        @inject(StorageController)
        protected storage: StorageController,
    ) {
    }

    async init() {
        // migrate datasets to bundles.
        try {
            const file = this.storage.getFilename('datasets.json');
            const text = await fs.readFile(file, 'utf-8');
            const { datasets = [], currentIndex = 0 } = JSON.parse(text);
            if (this.bundles.length === 0) {
                this.bundles.push(...datasets);
                this.bundleIndex = Number(currentIndex) || 0;
                this.save();
            }
            await fs.unlink(file);
            console.info('migrated dataset to bundles');
        } catch(err) {
            // do nothing.
        }
    }

    save() {
        this.project.update();
    }

    get bundles() {
        return this.project.automation.bundles;
    }

    get bundleIndex() {
        const { bundleIndex } = this.project.automation.metadata;
        return clamp(bundleIndex, 0, this.bundles.length - 1);
    }

    set bundleIndex(index: number) {
        this.project.automation.metadata.bundleIndex = clamp(index, 0, this.bundles.length - 1);
        this.save();
    }

    getCurrentBundle(): Bundle {
        if (!this.bundles.length) {
            this.createBundle({
                name: 'Input data',
                inputs: [],
                excluded: false,
            });
        }
        const current = this.bundles[this.bundleIndex];
        return current;
    }

    getPublicBundles(): Bundle[] {
        return this.bundles.filter(bundle => !bundle.excluded);
    }

    createBundle(spec: Bundle = {
        name: 'Input data',
        inputs: [],
        excluded: false,
    }) {
        this.bundles.push(spec);
        this.bundleIndex = this.bundles.length - 1;
    }

    deleteBundle(index: number = this.bundleIndex) {
        this.bundles.splice(index, 1);
        this.save();
    }

    findInput(key: string): ScriptInput | null {
        const { inputs } = this.getCurrentBundle();
        return inputs.find(i => i.key === key) ?? null;
    }

    getInputKeys(): string[] {
        const { inputs } = this.getCurrentBundle();
        const keys: Set<string> = new Set();
        for (const input of inputs) {
            keys.add(input.key);
        }
        return Array.from(keys);
    }

    getInputData(key: string, required: boolean = true): any {
        const input = this.findInput(key);
        if (!input && required) {
            throw new Error(`Input ${key} not found. Use "Data" tab to define test input data.`);
        }
        return input ? input.data : undefined;
    }

    collectInputPaths() {
        const { inputs } = this.getCurrentBundle();
        const obj: any = {};
        for (const { key, data } of inputs) {
            obj[key] = data;
        }
        return helpers.collectPointers(obj).map(_ => _.path);
    }

    createCurrentBundleProxy(): BundlesController {
        const bundle = this.getCurrentBundle();
        return helpers.createEditProxy(bundle, (k, v) => {
            (bundle as any)[k] = v;
            this.save();
        });
    }

    getInputExpandId(input: ScriptInput) {
        const bundle = this.getCurrentBundle();
        return (
            'bundle-' +
            this.bundleIndex +
            '-' +
            bundle.inputs.findIndex(_ => _.key === input.key)
        );
    }

    getJsonInputs() {
        const res: any = {};
        for (const input of this.getCurrentBundle().inputs) {
            res[input.key] = input.data;
        }
        return res;
    }

    addInput(input: ScriptInput, overwrite: boolean = false) {
        const bundle = this.getCurrentBundle();
        const existing = bundle.inputs.find(_ => _.key === input.key);
        if (existing) {
            if (!overwrite) {
                return;
            }
            existing.data = input.data;
        } else {
            bundle.inputs.push({
                key: input.key || '',
                data: input.data || null,
            });
        }
        this.expandable.expand(this.getInputExpandId(input));
        this.save();
    }

    removeInput(idx: number) {
        const bundle = this.getCurrentBundle();
        bundle.inputs.splice(idx, 1);
        this.save();
    }

    copyInput(input: ScriptInput) {
        clipboard.writeObject({
            type: 'bundle-inputs',
            data: [input]
        });
    }

    copyAllInputs() {
        clipboard.writeObject({
            type: 'bundle-inputs',
            data: this.getCurrentBundle().inputs,
        });
    }

    pasteInputs() {
        const inputs = clipboard.readObjectData('bundle-inputs');
        if (!inputs || !Array.isArray(inputs)) {
            return;
        }
        for (const i of inputs) {
            this.addInput(i, true);
        }
    }

    canPasteInputs() {
        return clipboard.hasObjectType('bundle-inputs');
    }

}
