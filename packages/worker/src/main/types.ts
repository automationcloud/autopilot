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

import { CdpCookie, GlobalValue } from '@automationcloud/engine';

export interface Execution {
    id: string;
    jobId: string;
    serviceId: string;
    scriptId: string;
    draft: boolean;
    domain: string;
    state: string;
    proxyId: string;
    checkpointId?: string;
    options?: {
        screenshot: boolean; // deprecated
        htmlSnapshot: boolean; // deprecated
        useRoxiCache: boolean;
        screenshotLevel: string;
        htmlSnapshotLevel: string;
    };
}

export interface ExecutionEvent {
    namespace: string;
    name: string;
    context?: any;
    action?: any;
    details?: any;
}

export interface Checkpoint {
    id: string;
    executionId: string;
    url: string;
    title: string;
    data: {
        cookies: CdpCookie[];
        method: string;
        postParams: Array<[string, string]>;
        localStorage: Array<[string, string]>;
        sessionStorage: Array<[string, string]>;
        globals: GlobalValue[];
    };
}

export interface ProxyConnection {
    hostname: string;
    port: number;
    authScheme: string;
    username: string;
    password: string;
}
