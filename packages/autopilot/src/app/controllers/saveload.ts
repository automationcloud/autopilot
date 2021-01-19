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
import { booleanConfig } from '@automationcloud/engine';
import { SettingsController } from './settings';
const AC_PUBLISH_SCRIPT_ON_SAVE = booleanConfig('AC_PUBLISH_SCRIPT_ON_SAVE', false);

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
        @inject(SettingsController)
        protected settings: SettingsController,
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

    get publishScriptOnSave() {
        return this.settings.get(AC_PUBLISH_SCRIPT_ON_SAVE);
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
            await this.saveProjectToFile(this.filePath);
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
        // Q: should update automation according the latest serevice -> serviceId, domainId, draft..?
        // or should update the service according to current automation in local machine
        const automation = { ...this.project.automation };
        const metadata: AutomationMetadata = {
            serviceId: service.id,
            serviceName: service.name,
            domainId: service.domain,
            draft: service.draft,
            version,
            bundleIndex: automation.metadata.bundleIndex,
        };

        const script = await this.api.createScript({
            serviceId: service.id,
            fullVersion: version,
            note: '',
            workerTag: 'stable', // to be removed, property of service.
            content: { ...automation, metadata },
        });
        // TODO: if metadata is updated (e.g. strict validation), update service here?
        /*
        if (service.domain !== automation.metadata.domainId || service.draft !== automation.metadata.draft) {
            this.api.updateServiceAttributes(service.id, {
                draft: metadata.draft,
                domain: metadata.domainId,
            });
        }
        */
        // update this.location
        if (this.publishScriptOnSave) {
            this.api.publishScript(script.id);
        }
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

    async saveProjectToFile(filePath: string) {
        if (!filePath) {
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.ubscript') {
            filePath = filePath.replace(ext, '.ubscript');
        }

        const serialized = JSON.stringify(this.project.automation);
        await fs.writeFile(filePath, serialized, 'utf-8');
        this.location = 'file';
        this.filePath = filePath;
        this.diff.setNewBase(this.project.automation.script);
        this.update();
    }

    async openProjectFromAc(scriptId: string) {
        const automation = await this.api.getScriptData(scriptId);
        await this.project.loadAutomationJson(automation);
        this.diff.setNewBase(automation);
        this.update();
    }

    async openProjectFromFile(filePath: string) {
        const text = await fs.readFile(filePath, 'utf-8');
        const automation = JSON.parse(text);
        await this.project.loadAutomationJson(automation);
        this.diff.setNewBase(automation);
        this.update();
    }

}

export interface ProjectLoadOptions {
    setDiffBase?: boolean;
    autosave?: boolean;
    filePath?: string;
}
