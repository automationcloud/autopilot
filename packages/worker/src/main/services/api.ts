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

import { injectable, inject } from 'inversify';
import { Execution, Checkpoint, ProxyConnection } from '../types';
import {
    Context,
    Action,
    CheckpointData,
    ApiRequest,
} from '@automationcloud/engine';
import { WorkerInfo } from './state';

export interface RequestOptions {
    url: string;
    method?: string;
    body?: any;
    query?: { [key: string]: any };
}

@injectable()
export class ApiService {

    constructor(
        @inject(ApiRequest)
        protected api: ApiRequest,
    ) {}

    setOrganisationId(organisationId: string) {
        this.api.request.config.headers['x-ubio-organisation-id'] = organisationId;
    }

    clearOrganisationId() {
        delete this.api.request.config.headers['x-ubio-organisation-id'];
    }

    async createExecution(spec: { jobId: string; workerId: string; workerVersion: string }): Promise<Execution> {
        return await this.api.post(`/private/executions`, {
            body: {
                jobId: spec.jobId,
                workerId: spec.workerId,
                workerEngineVersion: spec.workerVersion,
            },
        });
    }

    async getExecution(executionId: string): Promise<Execution> {
        return await this.api.get(`/private/executions/${executionId}`);
    }

    async getScriptContent(scriptId: string): Promise<any> {
        return await this.api.get(`/private/scripts/${scriptId}/content`);
    }

    async setExecutionSuccess(executionId: string): Promise<void> {
        return await this.api.post(`/private/executions/${executionId}/finish`);
    }

    async failExecution(executionId: string, error: any): Promise<void> {
        return await this.api.post(`/private/executions/${executionId}/fail`, {
            body: {
                error: {
                    name: error.name,
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    stack: error.stack,
                    websiteMessage: error.websiteMessage || '',
                    scriptError: !!error.scriptError,
                },
            },
        });
    }

    async requestInputData(executionId: string, key: string): Promise<any> {
        return await this.api.post(`/private/executions/${executionId}/request-input`, {
            body: {
                key,
            },
        });
    }

    async getInputData(executionId: string, key: string): Promise<any> {
        return await this.api.get(`/private/executions/${executionId}/inputs/${key}`);
    }

    async sendOutputData(executionId: string, key: string, data: any) {
        return await this.api.post(`/private/executions/${executionId}/outputs`, {
            body: {
                key,
                data,
            },
        });
    }

    async createScreenshot(executionId: string, info: WorkerInfo, spec: any): Promise<any> {
        return await this.api.post('/private/screenshots', {
            body: {
                executionId,
                workerId: info.workerId,
                title: spec.title,
                mimeType: spec.mimeType,
                imageData: spec.imageData,
                action: presentAction(spec.action),
                context: presentContext(spec.context),
                timestamp: Date.now(),
                width: spec.width,
                height: spec.height,
                fullPage: spec.fullPage,
                public: spec.isPublic, // deprecated
                isPublic: spec.isPublic,
            },
        });
    }

    async createHtmlSnapshot(executionId: string, info: WorkerInfo, spec: any): Promise<any> {
        return await this.api.post('/private/html-snapshots', {
            body: {
                executionId,
                workerId: info.workerId,
                title: spec.title,
                url: spec.url,
                html: spec.html,
                action: presentAction(spec.action),
                context: presentContext(spec.context),
                timestamp: Date.now(),
            },
        });
    }

    async createExecutionEvent(executionId: string, spec: any): Promise<void> {
        return await this.api.post('/private/execution-events', {
            body: {
                executionId,
                namespace: spec.namespace,
                name: spec.name,
                details: spec.details || {},
                action: presentAction(spec.action),
                context: presentContext(spec.context),
                timestamp: Date.now(),
            },
        });
    }

    async getProxyConnection(id: string): Promise<ProxyConnection> {
        return await this.api.get(`/Proxy/getConnection`, {
            query: { id },
        });
    }

    async sendHeartbeat(executionId: string | null, state: string, info: WorkerInfo): Promise<void> {
        return await this.api.put(`/private/workers/${info.workerId}`, {
            body: {
                state,
                executionId,
                workerTag: info.workerTag,
                version: info.workerVersion,
            },
        });
    }

    async deleteWorker(workerId: string): Promise<void> {
        return await this.api.delete(`/private/workers/${workerId}`);
    }

    async createCheckpoint(
        executionId: string,
        consumedInputKeys: string[],
        checkpointData: CheckpointData,
    ): Promise<Checkpoint> {
        const { url, title, cookies, method, postParams, localStorage, sessionStorage, globals } = checkpointData;
        return await this.api.post('/private/checkpoints', {
            body: {
                executionId,
                url,
                title,
                consumedInputKeys,
                data: {
                    cookies,
                    method,
                    postParams,
                    localStorage,
                    sessionStorage,
                    globals,
                },
            },
        });
    }

    async getCheckpoint(id: string): Promise<CheckpointData> {
        const {
            url,
            title,
            data: { cookies, method, postParams, sessionStorage, localStorage, globals },
        } = await this.api.get(`/private/checkpoints/${id}`);
        return {
            url,
            title,
            cookies,
            method,
            postParams,
            sessionStorage,
            localStorage,
            globals,
        };
    }

}

function presentContext(context: Context): any {
    return context ? {
        id: context.id,
        type: context.type,
        name: context.name,
        flowType: context.flowType,
        errorCode: context.errorCode,
    } : null;
}

function presentAction(action: Action): any {
    return action ? {
        id: action.id,
        type: action.type,
        label: action.label,
        runtime: action.$runtime,
    } : null;
}
