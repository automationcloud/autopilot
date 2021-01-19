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
import { ApiController } from './api';
import { EventsController } from './events';
import { ScriptDiffController } from './script-diff';

@injectable()
@controller({ alias: 'acAutomation' })
export class AcAutomationController {

    constructor(
        @inject(ApiController)
        protected api: ApiController,
        @inject(EventsController)
        protected event: EventsController,
        @inject(ScriptDiffController)
        protected diff: ScriptDiffController,
    ) {
    }

    async init() {}

    async getAutomation(serviceId: string, scriptId?: string) {
        if (!scriptId) {
            const service = await this.getService(serviceId);
            if (!service.scriptId) {
                // no published script
                alert('no published script.');
                return;
            }
            scriptId = service.scriptId;
        }

        return await this.api.getScriptData(scriptId);
    }

    async getServices() {
        return await this.api.getServices();
    }

    async getService(id: string) {
        return await this.api.getService(id);
    }

    async getScripts(serviceId: string): Promise<any> {
        return await this.api.getScripts({ serviceId, limit: 20, offset: 0 });
    }

    async getScript(id: string) {
        return await this.api.getScript(id);
    }

    // fs dialogs
}
