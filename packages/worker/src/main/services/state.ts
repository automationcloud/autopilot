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

import { injectable, inject } from 'inversify';
import { Execution } from '../types';
import { Script, util, Configuration, stringConfig } from '@automationcloud/engine';
import uuid from 'uuid';
const pkg = (require as any)('../../../package.json');

const WORKER_TAG = stringConfig('WORKER_TAG');

@injectable()
export class WorkerState {
    workerVersion: string;
    workerTag: string;
    workerId: string;
    state: 'idle' | 'initializing' | 'running' | 'consume-failing' | 'terminating-execution' | 'disconnected' = 'idle';
    execution: Execution | null = null;
    script: Script | null = null;
    organisationId: string | null = null;
    executionId: string | null = null;
    jobId: string | null = null;
    serviceId: string | null = null;
    domainId: string | null = null;
    jobStartedAt: number = 0;
    executionsProcessed: number = 0;

    constructor(
        @inject(Configuration)
        protected config: Configuration,
    ) {
        this.config = config;
        this.workerVersion = pkg.version;
        this.workerTag = config.get(WORKER_TAG);
        this.workerId = process.env.HOSTNAME || uuid.v4();
    }

    getExecution(): Execution {
        if (!this.execution) {
            throw util.createError({
                code: 'InvalidWorkerState',
                message: 'Invalid state: execution is not yet available',
                retry: false,
            });
        }
        return this.execution;
    }

    getScript(): Script {
        if (!this.script) {
            throw util.createError({
                code: 'InvalidWorkerState',
                message: 'Invalid state: script is not yet available',
                retry: false,
            });
        }
        return this.script;
    }

    isRunning() {
        return this.execution != null;
    }

    setExecution(execution: Execution) {
        this.execution = execution;
        this.executionId = execution.id;
        this.jobId = execution.jobId;
        this.serviceId = execution.serviceId;
        this.domainId = execution.domain;
    }

    clear() {
        this.state = 'idle';
        this.execution = null;
        this.script = null;
        this.organisationId = null;
        this.executionId = null;
        this.jobId = null;
        this.serviceId = null;
        this.domainId = null;
    }

    getInfo(): WorkerInfo {
        return {
            workerId: this.workerId,
            workerTag: this.workerTag,
            workerVersion: this.workerVersion,
            jobId: this.jobId,
            executionId: this.executionId,
            serviceId: this.serviceId,
        };
    }
}

export interface WorkerInfo {
    workerId: string;
    workerTag: string;
    workerVersion: string;
    jobId: string | null;
    executionId: string | null;
    serviceId: string | null;
}
