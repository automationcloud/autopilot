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

import { Configuration, Logger, numberConfig } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';

import { ApiService } from './api';
import { WorkerState } from './state';

const HEARTBEAT_INTERVAL = numberConfig('HEARTBEAT_INTERVAL', 5000);

@injectable()
export class HeartbeatsService {
    @inject(Configuration)
    config!: Configuration;
    @inject(WorkerState)
    state!: WorkerState;
    @inject(ApiService)
    api!: ApiService;
    @inject(Logger)
    logger!: Logger;

    heartbeating: boolean = false;

    start() {
        this.heartbeating = true;
        this.heartbeat().catch(() => {});
    }

    stop() {
        this.heartbeating = false;
    }

    async heartbeat() {
        const interval = this.config.get(HEARTBEAT_INTERVAL);
        while (this.heartbeating) {
            try {
                await this.api.sendHeartbeat(this.state.executionId, this.state.state, this.state.getInfo());
            } catch (error) {
                this.logger.error('Failed to send heartbeat', { error });
            }
            await new Promise(r => setTimeout(r, interval));
        }
    }
}
