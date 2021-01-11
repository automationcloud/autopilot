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
import path from 'path';
import { promises as fs } from 'fs';
import { controller } from '../controller';
import { UserData } from '../userdata';
import { AutosaveController } from './autosave';
import { ModalsController } from './modals';
import { ProjectController } from './project';
import { StorageController } from './storage';
import { ApiController } from './api';
import { AutomationMetadata } from '../entities/automation';
import { ScriptDiffController } from './script-diff';

const DIALOG_FILTERS = [
    { name: 'UB Automation', extensions: ['ubscript', 'automation', 'json', 'json5'] },
    { name: 'All Files', extensions: ['*'] },
];

@injectable()
@controller({ alias: 'saveload' })
export class SaveLoadController {
    userData: UserData;
    location: 'file' | 'ac' = 'file';
    filePath: string | null = null;

    constructor(
        @inject(StorageController)
        protected storage: StorageController,
        @inject(ProjectController)
        protected project: ProjectController,
        @inject(AutosaveController)
        protected autosave: AutosaveController,
        @inject(ModalsController)
        protected modals: ModalsController,
        @inject(ApiController)
        protected api: ApiController,
        @inject(ScriptDiffController)
        protected diff: ScriptDiffController,
    ) {
        this.userData = storage.createUserData('saveload');
    }

    async init() {
        const {
            filePath = null,
            location = 'file',
        } = await this.userData.loadData();
        this.filePath = filePath;
        this.location = location;
    }

    update() {
        this.userData.saveData({
            location: this.location,
            filePath: this.filePath,
        });
    }

    async newProject() {
        this.filePath = null;
        await this.autosave.saveCurrent();
        this.project.loadAutomationJson({});
        this.update();
    }

    async openProject() {
        this.modals.show('open-automation');
    }

    async saveProject() {
        if (this.location === 'file' && this.filePath) {
            await this.saveProjectToFs(this.filePath);
        } else {
            await this.saveProjectAs();
        }
    }

    async saveProjectAs() {
        this.modals.show('save-automation');
    }

    async saveProjectToAc(serviceId: string, version: string) {
        // fetch service with serviceId.
        const service = await this.api.getService(serviceId);
        // update metadata -> serviceId, domainId, draft..
        const automation = { ...this.project.automation };
        const metadata: AutomationMetadata = {
            serviceId: service.id,
            serviceName: service.name,
            domainId: service.domain,
            draft: service.draft,
            version,
            bundleIndex: automation.metadata.bundleIndex,
        };

        await this.api.createScript({
            serviceId: service.id,
            fullVersion: version,
            note: '',
            workerTag: 'stable', // to be removed, property of service.
            content: { ...automation, metadata },
        });

        // update this.location
        this.location = 'ac';
        this.project.updateMetadata(metadata);
        this.diff.setNewBase(this.project.automation.script);
        this.update();
    }

    // TODO: move it to somewhere else more relevant
    async createService(name: string) {
        const { domainId: domain, draft } = this.project.automation.metadata;
        const spec = {
            name,
            domain,
            draft,
            note: ''
        };
        return await this.api.createService(spec);
    }

    async saveProjectToFs(filePath: string) {
        if (!filePath) {
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.automation') {
            filePath = filePath.replace(ext, '.automation');
        }

        const serialized = JSON.stringify(this.project.automation);
        await fs.writeFile(filePath, serialized, 'utf-8');
        this.location = 'file';
        this.filePath = filePath;
        this.diff.setNewBase(this.project.automation.script);
        this.update();
    }

    // TODO remove those (kept for reference atm)
    /*
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
