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

import { Logger, CheckpointService, GlobalsService, BrowserService, CheckpointData } from '@automationcloud/engine';
import { injectable, inject } from 'inversify';
import { ApiService } from '../services/api';
import { WorkerState } from '../services/state';

@injectable()
export class WorkerCheckpointService extends CheckpointService {
    constructor(
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(GlobalsService)
        protected globals: GlobalsService,
        @inject(Logger)
        protected logger: Logger,
        @inject(ApiService)
        protected api: ApiService,
        @inject(WorkerState)
        protected state: WorkerState,
    ) {
        super(browser, globals);
    }

    async sendCheckpoint(checkpointData: CheckpointData) {
        this.logger.info('Creating checkpoint');
        const execution = this.state.getExecution();
        const script = this.state.getScript();
        const consumedInputKeys = [...script.$consumedInputKeys];
        const checkpoint = await this.api.createCheckpoint(execution.id, consumedInputKeys, checkpointData);
        const { id: checkpointId } = checkpoint;
        this.logger.info('Created checkpoint', { checkpointId });
    }
}
