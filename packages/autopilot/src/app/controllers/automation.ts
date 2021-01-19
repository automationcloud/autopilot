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
import { ApiController, ApiScript, ApiService } from './api';
import { ProjectController } from './project';

@injectable()
@controller({ alias: 'acAutomation' })
export class AcAutomationController {
    services: ApiService[] = [];
    scripts: ApiScript[] = [];

    constructor(
        @inject(ApiController)
        protected api: ApiController,
        @inject(ProjectController)
        protected project: ProjectController,
    ) {
    }

    async init() {}

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
        this.services = await this.api.getServices();
        return this.services;
    }

    async getService(id: string) {
        return await this.api.getService(id);
    }

    async getScripts(serviceId: string): Promise<any> {
        this.scripts = await this.api.getScripts({ serviceId, limit: 20, offset: 0 });
        return this.scripts;
    }

    async getScript(id: string) {
        return await this.api.getScript(id);
    }

    // fs dialogs
}
