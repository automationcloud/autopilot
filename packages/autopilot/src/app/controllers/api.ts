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

import { CdpCookie, GlobalValue, ApiRequest } from '@automationcloud/engine';
import { injectable, inject } from 'inversify';
import { controller } from '../controller';

export interface RequestOptions {
    url: string;
    method?: string;
    body?: any;
    query?: { [key: string]: any };
}

@injectable()
@controller()
export class ApiController {
    constructor(
        @inject(ApiRequest)
        protected api: ApiRequest,
    ) {
    }

    async init() {}

    async getServices(
        options: {
            name?: string | null;
            archived?: boolean | null;
            domainId?: string | null;
            limit?: number;
            offset?: number;
        } = {},
    ): Promise<ApiService[]> {
        const { name, archived, domainId, limit = 100, offset = 0 } = options;
        const qs = Object.entries({ name, archived, domain: domainId, limit, offset })
            .filter(e => e[1] != null);
        const query = Object.fromEntries(qs);
        const { data } = await this.api.get('/private/services', { query });
        return data;
    }

    async getService(serviceId: string): Promise<ApiService> {
        return await this.api.get(`/private/services/${serviceId}`);
    }

    async createService(spec: {
        name: string;
        domain: string;
        draft: boolean;
        note: string;
    }): Promise<ApiService> {
        return await this.api.post('/private/services', {
            body: spec,
        });
    }

    async updateServiceAttributes(serviceId: string, attributes: object): Promise<ApiService> {
        return await this.api.put(`/private/services/${serviceId}`, {
            body: { attributes },
        });
    }

    async updateService(serviceId: string, domain: string, draft: boolean): Promise<ApiService> {
        return await this.api.put(`/private/services/${serviceId}`, {
            body: { domain, draft },
        });
    }

    async getScript(id: string): Promise<ApiScript> {
        return await this.api.get(`/private/scripts/${id}`);
    }

    async getScripts(options: { serviceId: string; limit?: number; offset?: number }): Promise<ApiScript[]> {
        const { serviceId, limit, offset } = options;
        const { data } = await this.api.get('/private/scripts', {
            query: { serviceId, limit, offset },
        });
        return data;
    }

    async getScriptData(scriptId: string): Promise<any> {
        return await this.api.get(`/private/scripts/${scriptId}/content`);
    }

    async createScript(spec: {
        serviceId: string;
        fullVersion: string;
        note: string;
        workerTag: string;
        content: any;
    }) {
        return await this.api.post('/private/scripts', {
            body: spec,
        });
    }

    async publishScript(scriptId: string) {
        return await this.api.post(`/private/scripts/${scriptId}/publish`);
    }

    async getJob(id: string): Promise<ApiJob> {
        return await this.api.get(`/private/jobs/${id}`);
    }

    async getJobInputs(jobId: string): Promise<ApiJobInput[]> {
        const { data } = await this.api.get(`/private/jobs/${jobId}/inputs`);
        return data;
    }

    async getExecution(id: string): Promise<ApiExecution> {
        return await this.api.get(`/private/executions/${id}`);
    }

    async getDistinctTags(): Promise<string[]> {
        const { tags } = await this.api.get('/Proxy/getDistinctTags');
        return tags;
    }

    async sample(tags: string[]): Promise<ProxyConfig> {
        return await this.api.get('/Proxy/sample', {
            query: {
                tags,
            },
        });
    }

    async getExecutionErrors(domainId: string): Promise<ExecutionError[]> {
        const { data } = await this.api.get('/private/execution-errors', {
            query: {
                domain: domainId,
                scriptError: true,
                limit: 1000,
            },
        });
        return data;
    }

    async getHtmlSnapshot(id: string): Promise<ApiHtmlSnapshot> {
        const snapshot = await this.api.get(`/private/html-snapshots/${id}`);
        const htmlRes = await this.api.request.send('get', `/private/html-snapshots/${id}/html`);
        snapshot.html = await htmlRes.text();
        return snapshot;
    }

    async getCheckpoints(options: { executionId: string; limit?: number; offset?: number }): Promise<ApiCheckpoint[]> {
        const { executionId, limit, offset } = options;
        const { data } = await this.api.get('/private/checkpoints', {
            query: { executionId, limit, offset },
        });
        return data;
    }

    async getCheckpoint(id: string): Promise<ApiCheckpoint> {
        return await this.api.get(`/private/checkpoints/${id}`);
    }

}

export interface ExecutionError {
    id: string;
    jobErrorDomain: string;
    code: string;
}

export interface ApiService {
    id: string;
    name: string;
    scriptId: string;
    domain: string;
    draft: boolean;
}

export interface ApiScript {
    id: string;
    serviceId: string;
    version: string;
    workerVersion: string;
    note: string;
}

export interface ApiJob {
    id: string;
    serviceId: string;
    scriptId: string;
}

export interface ApiJobInput {
    id: string;
    jobId: string;
    key: string;
    stage: string;
    data: any;
}

export interface ApiExecution {
    id: string;
    serviceId: string;
    scriptId: string;
    jobId: string;
}

export interface ApiHtmlSnapshot {
    id: string;
    jobId: string;
    scriptId: string;
    title: string;
    html: string;
}

export interface ApiCheckpoint {
    id: string;
    jobId: string;
    executionId: string;
    url: string;
    title: string;
    data: {
        method?: string;
        cookies?: CdpCookie[];
        postParams?: Array<[string, string]>;
        localStorage?: Array<[string, string]>;
        sessionStorage?: Array<[string, string]>;
        globals?: GlobalValue[];
    };
}

export interface ProxyConfig {
    id: string;
    ip: string | null;
    tags: string[];
    providerId: string | null;
    totalBlockedCount: number;
    refreshIp: boolean;
    connection: {
        hostname: string;
        port: number;
        authScheme: string;
        username: string;
        password: string;
        dynamicIp: boolean;
    };
}
