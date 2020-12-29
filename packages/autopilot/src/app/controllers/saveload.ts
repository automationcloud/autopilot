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
import { AutosaveController } from './autosave';
import { ProjectController } from './project';

const DIALOG_FILTERS = [
    { name: 'UB Automation', extensions: ['ubscript', 'json', 'json5'] },
    { name: 'All Files', extensions: ['*'] },
];

@injectable()
@controller()
export class SaveLoadController {

    constructor(
        @inject(ProjectController)
        protected project: ProjectController,
        @inject(AutosaveController)
        protected autosave: AutosaveController,
    ) {
    }

    async init() {

    }

    /*
    async newProject() {
        this.filePath = null;
        this.loadFromJson({
            script: {},
            datasets: [],
            metadata: DEFAULT_METADATA,
        });
        this.update();
    }

    async openProject() {
        const filePaths = await helpers.showOpenDialog({
            title: 'Open Project',
            filters: DIALOG_FILTERS,
            properties: ['openFile'],
        });
        if (filePaths.length === 0) {
            return;
        }
        const file = filePaths[0];
        await this.loadFromFile(file, { filePath: file });
    }

    async saveProject() {
        return this.filePath ? await this.saveToFile(this.filePath) : await this.saveProjectAs();
    }

    async saveProjectAs() {
        const filePath = await helpers.showSaveDialog({
            title: 'Save Project',
            filters: DIALOG_FILTERS,
        });
        if (filePath == null) {
            return;
        }
        await this.saveToFile(filePath);
    }

    async loadFromFile(filePath: string, options: ProjectLoadOptions = {}) {
        try {
            const text = await fs.readFile(filePath, 'utf-8');
            const json = JSON.parse(text);
            await this.loadFromJson(json, options);
        } catch (e) {
            console.error('Load failed', e);
            alert('Load failed. Please check console for details.');
        }
    }

    async loadFromJson(json: any, options: ProjectLoadOptions = {}) {
        const { setDiffBase = true, autosave = true, filePath = null } = options;
        try {
            if (autosave) {
                await this.autosave();
            }
            this.initScript(json.script);
            if (setDiffBase) {
                this.diff.setNewBase(json.script);
            }
            if (json.datasets) {
                this.datasets.loadDatasets(json.datasets);
            }
            Object.assign(this.metadata, json.metadata);
            this.filePath = filePath;
            this.update();
        } catch (e) {
            console.error('Load failed', e);
            alert('Load failed. Please check console for details.');
        }
    }

    async saveToFile(filePath: string) {
        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.ubscript') {
            filePath = filePath + '.ubscript';
        }
        try {
            const serialized = JSON.stringify(this.serializeProjectState());
            await fs.writeFile(filePath, serialized, 'utf-8');
            this.filePath = filePath;
            this.diff.setNewBase(this.script);
        } catch (e) {
            console.error('Save failed', e);
            alert('Save failed. Please check console for details.');
        }
    }
    */

}

export interface ProjectLoadOptions {
    setDiffBase?: boolean;
    autosave?: boolean;
    filePath?: string;
}
