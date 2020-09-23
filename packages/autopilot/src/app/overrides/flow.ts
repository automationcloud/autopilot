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

import { FlowService, util } from '@automationcloud/engine';
import { injectable, inject } from 'inversify';
import { ProtocolController, ProjectController, DatasetsController } from '../controllers';

@injectable()
export class AutopilotFlowService extends FlowService {

    constructor(
        @inject(DatasetsController)
        protected datasets: DatasetsController,
        @inject(ProtocolController)
        protected protocol: ProtocolController,
        @inject(ProjectController)
        protected project: ProjectController,
    ) {
        super();
    }

    isInputsCached() {
        return false;
    }

    async requestInputData(key: string) {
        const data = this.datasets.getInputData(key, '');
        return util.deepClone(data);
    }

    async peekInputData(key: string) {
        const data = this.datasets.getInputData(key, '', false);
        return util.deepClone(data);
    }

    async sendOutputData(key: string, data: any) {
        const { draft } = this.project.metadata;
        const domain = this.protocol.getDomain();
        if (!domain) {
            throw new Error('Cannot access protocol for validation');
        }
        const validation = await domain.validateOutput(key, data);
        if (!validation.valid && !draft) {
            throw new Error('Output is invalid. Disable "strict validation" mode to suppress the error.');
        }
    }

    async setPnr() {}

    async unsetPnr() {}
}
