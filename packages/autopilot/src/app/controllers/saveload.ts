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
import { Automation, AutomationMetadata } from '../entities/automation';
import { BundlesController } from './bundles';
import { shell } from 'electron';
import { acUrls } from '../util';

@injectable()
@controller({ alias: 'saveload' })
export class SaveLoadController {
    userData: UserData;
    location: 'file' | 'ac' = 'file';
    filePath: string | null = null;
    _setDiffBase: boolean = true;

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
        protected events: EventsController,
        @inject(BundlesController)
        protected bundles: BundlesController,
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

    get setDiffBase() { return this._setDiffBase; }

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
        this._setDiffBase = true;
        this.modals.show('open-automation');
    }

    async loadAsDiff() {
        this._setDiffBase = false;
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
        serviceName: string;
        fullVersion: string;
        workerTag: string;
        activate: boolean;
        note: string;
    }) {
        const { serviceId, fullVersion, workerTag, activate, note = '' } = spec;
        const automation = this.project.automation;
        automation.metadata.serviceId = serviceId;
        automation.metadata.version = fullVersion;
        const content = this.prepareScriptContent(automation);
        const script = await this.api.createScript({
            serviceId,
            fullVersion,
            note,
            workerTag,
            content,
        });
        const service = await this.api.getService(serviceId);
        await this.api.updateService({
            id: serviceId,
            name: automation.metadata.serviceName,
            domain: automation.metadata.domainId,
            draft: automation.metadata.draft,
            attributes: service.attributes,
        });
        if (activate) {
            await this.api.publishScript(script.id);
        }
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
        if (this.setDiffBase) {
            this.diff.setNewBase(content.script);
        }
        this.location = 'ac';
        this.update();
    }

    async openAutomationFromFile(filePath: string) {
        const text = await fs.readFile(filePath, 'utf-8');
        const automation = JSON.parse(text);
        await this.project.loadAutomationJson(automation);
        this.location = 'file';
        this.filePath = filePath;
        if (this.setDiffBase) {
            this.diff.setNewBase(automation.script);
        }
        this.update();
    }

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

        return await this.api.createService(spec);
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

    protected prepareScriptContent(automation: Automation) {
        const bundles = automation.bundles.filter(bundle => !bundle.excluded)
            .map(bundle => {
                // TODO remove this.backwards compat hack
                // Note: QA tool expects stage to be present
                return {
                    name: bundle.name,
                    inputs: bundle.inputs.map(input => {
                        return {
                            ...input,
                            stage: '',
                        };
                    }),
                };
            });
        return {
            script: automation.script,
            metadata: automation.metadata,
            bundles,
            // TODO remove this.backwards compat hack
            datasets: bundles,
        };
    }

    async openAutomationManage() {
        const { serviceId } = this.project.automation.metadata;
        if (serviceId) {
            const baseUrl = acUrls.get('dashboard');
            await shell.openExternal(`${baseUrl}/services/${serviceId}/script-versions`);
        }
    }
}
