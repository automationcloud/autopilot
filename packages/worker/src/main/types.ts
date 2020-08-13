import { CdpCookie, GlobalValue } from '@automationcloud/engine';

export interface Execution {
    id: string;
    jobId: string;
    serviceId: string;
    scriptId: string;
    draft: boolean;
    domain: string;
    state: string;
    ip: string;
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
