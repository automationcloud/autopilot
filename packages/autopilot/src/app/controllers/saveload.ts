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
import { ScriptDiffController } from './script-diff';
import { SettingsController } from './settings';
import { EventsController } from './events';
import { AutomationMetadata } from '../entities/automation';

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
        @inject(EventsController)
        protected events: EventsController
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

    async newAutomation() {
        this.filePath = null;
        this.project.loadAutomationJson({});
        this.update();
    }

    async openAutomation() {
        this.modals.show('open-automation');
    }

    async saveAutomation() {
        if (this.location === 'file' && this.filePath) {
            await this.saveAutomationToFile(this.filePath);
        } else {
            await this.saveAutomationAs();
        }
    }

    async saveAutomationAs() {
        this.modals.show('save-automation');
    }

    async saveAutomationToAc(spec: {
        serviceId: string;
        fullVersion: string;
        workerTag: string;
        activate: boolean;
        note: string;
    }) {
        const { serviceId, fullVersion, workerTag, activate, note = '' } = spec;
        const automation = { ...this.project.automation };
        const metadata = {
            ...automation.metadata,
            version: fullVersion,
            serviceId,
        };
        const script = await this.api.createScript({
            serviceId,
            fullVersion,
            note,
            workerTag,
            content: {
                ...automation,
                metadata,
                datasets: automation.bundles // for backward compat.
            },
        });

        this.api.updateService({
            id: metadata.serviceId,
            name: metadata.serviceName,
            domain: metadata.domainId,
            draft: metadata.draft
        });
        if (activate) {
            this.api.publishScript(script.id);
        }
        this.project.updateMetadata(metadata);
        this.location = 'ac';
        this.diff.setNewBase(automation.script);
        this.update();
    }

    async saveAutomationToFile(filePath: string) {
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

    async openAutomationFromAc(serviceId: string, scriptId: string) {
        const service = await this.api.getService(serviceId);
        const script = await this.api.getScript(scriptId);
        const content = await this.api.getScriptData(scriptId);
        const metadata: AutomationMetadata = {
            serviceId: service.id,
            serviceName: service.name,
            draft: service.draft,
            domainId: service.domain,
            version: script.version,
            bundleIndex: 0,
        };
        await this.project.loadAutomationJson({
            ...content,
            metadata,
        });
        this.diff.setNewBase(content.script);
        this.location = 'ac';
        this.update();
    }

    async openAutomationFromFile(filePath: string) {
        const text = await fs.readFile(filePath, 'utf-8');
        const automation = JSON.parse(text);
        await this.project.loadAutomationJson(automation);
        this.location = 'file';
        this.filePath = filePath;
        this.diff.setNewBase(automation.script);
        this.update();
    }

    // apis
    async getActiveScriptId(serviceId: string) {
        const service = await this.getService(serviceId);
        return service.scriptId || null;
    }

    async createService(name: string) {
        const { domainId: domain, draft } = this.project.automation.metadata;
        const spec = {
            name,
            domain,
            draft,
            note: ''
        };
        const service = await this.api.createService(spec);
        this.getServices();

        return service;
    }

    async getServices() {
        return await this.api.getServices();
    }

    async getService(id: string) {
        return await this.api.getService(id);
    }

    async getScripts(serviceId: string, limit: number = 20, offset: number = 0): Promise<any> {
        return await this.api.getScripts({ serviceId, limit, offset });
    }

    async getScript(id: string) {
        return await this.api.getScript(id);
    }
}

export interface ProjectLoadOptions {
    setDiffBase?: boolean;
    autosave?: boolean;
    filePath?: string;
}
