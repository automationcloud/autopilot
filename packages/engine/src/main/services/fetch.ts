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

import { CdpHeaders, Logger } from '@automationcloud/cdp';
import { HttpProxyAgent, HttpsProxyAgent } from '@automationcloud/uniproxy';
import FormData from 'form-data';
import http from 'http';
import { inject, injectable } from 'inversify';
import nodeFetch, { RequestInit } from 'node-fetch';
import querystring from 'querystring';
import uuid from 'uuid';

import * as util from '../util';
import { BlobService } from './blob';
import { BrowserService } from './browser';
import { ProxyService } from './proxy';

export const RETRIABLE_ERRORS = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE', 'ERR_STREAM_DESTROYED'];

export type FetchMode = 'Fetch' | 'Node' | 'Node+Proxy';

export interface FetchRequestSpec {
    mode: FetchMode;
    requestBodyFormat: RequestBodyFormat;
    responseBodyFormat: ResponseBodyFormat;
    retries: number;
    timeout: number;
    method: string;
    url: string;
    headers: CdpHeaders;
    body: any;
}

export interface FetchResponseSpec {
    url: string;
    status: number;
    statusText: string;
    headers: CdpHeaders;
    body: any | null;
}

export type RequestBodyFormat = 'none' | 'json' | 'text' | 'multipart' | 'urlencoded';
export type ResponseBodyFormat = 'none' | 'json' | 'text' | 'urlencoded' | 'blob' | 'base64';
export interface RequestBodySpec {
    body: string;
    headers: CdpHeaders;
}

/**
 * Facilitates sending HTTP requests via several preconfigured environments:
 *
 * - Fetch — uses Chrome Network Layer to send requests,
 *   reusing cookies from browsing session, but subject to CORS limitations;
 *   requests go through default proxy
 * - Node.js — uses Node.js runtime to send requests
 * - Node.js + Proxy — uses Node.js runtime to send requests,
 *   requests go through default proxy
 *
 */
@injectable()
export class FetchService {

    constructor(
        @inject(BlobService)
        protected blobs: BlobService,
        @inject(Logger)
        protected logger: Logger,
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(ProxyService)
        protected proxy: ProxyService,
    ) {}

    async send(_spec: Partial<FetchRequestSpec>): Promise<FetchResponseSpec> {
        const spec = await this.prepareRequestSpec(_spec);
        return await this.sendWithRetries(spec);
    }

    async prepareRequestSpec(spec: Partial<FetchRequestSpec>): Promise<FetchRequestSpec> {
        const mode = spec.mode || 'Fetch';
        const requestBodyFormat = spec.requestBodyFormat || 'none';
        const responseBodyFormat = spec.responseBodyFormat || 'none';
        const retries = typeof spec.retries === 'number' ? spec.retries : 3;
        const timeout = typeof spec.timeout === 'number' ? spec.timeout : 120000;
        const method = String(spec.method || 'GET').toUpperCase();
        const url = util.formatUrl(spec);
        const { body, headers: bodyHeaders } = await this.prepareRequestBody(spec);
        const headers = Object.assign({}, bodyHeaders, this.prepareRequestHeaders(spec));
        return {
            mode,
            requestBodyFormat,
            responseBodyFormat,
            retries,
            timeout,
            method,
            url,
            headers,
            body,
        };
    }

    protected prepareRequestHeaders(spec: Partial<FetchRequestSpec>): CdpHeaders {
        const { headers = {} } = spec;
        const result: CdpHeaders = {};
        for (const key of Object.keys(headers)) {
            result[key.toLowerCase()] = headers[key];
        }
        return result;
    }

    protected async prepareRequestBody(spec: Partial<FetchRequestSpec>): Promise<RequestBodySpec> {
        const { body = {} } = spec;
        switch (spec.requestBodyFormat) {
            case 'json':
                return {
                    body: JSON.stringify(body),
                    headers: {
                        'content-type': 'application/json; charset=utf-8',
                    },
                };
            case 'urlencoded':
                return {
                    body: querystring.stringify(body),
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                    },
                };
            case 'text':
                return {
                    body: typeof body === 'object' ? JSON.stringify(body) : String(body),
                    headers: {
                        'content-type': 'text/plain',
                    },
                };
            case 'multipart':
                return await this.prepareMultipartRequestBody(spec);
            default:
                return {
                    body: '',
                    headers: {},
                };
        }
    }

    async prepareMultipartRequestBody(spec: Partial<FetchRequestSpec>): Promise<RequestBodySpec> {
        let body: any = spec.body || {};
        if (typeof body !== 'object') {
            body = {};
        }
        util.checkType(body, 'object', 'body');
        const formData = new FormData();
        for (const key of Object.keys(body)) {
            const value = body[key];
            if (util.getType(value) === 'object') {
                const { blobId, filename } = value;
                util.checkType(blobId, 'string', `body.${key}.blobId`);
                util.checkType(filename, 'string', `body.${key}.filename`);
                const buffer = await this.blobs.readBlob(blobId);
                formData.append(key, buffer, { filename });
            } else {
                formData.append(key, String(value));
            }
        }
        const headers = formData.getHeaders();
        const buffer = await util.streamToBuffer(formData);
        return {
            headers,
            body: buffer.toString('binary'),
        };
    }

    async sendWithRetries(spec: FetchRequestSpec): Promise<FetchResponseSpec> {
        let attempts = spec.retries;
        let lastError;
        while (attempts > 0) {
            attempts -= 1;
            try {
                return await this.sendSingleRequest(spec);
            } catch (error) {
                lastError = error;
                const canRetry = RETRIABLE_ERRORS.includes(error.code);
                if (!canRetry) {
                    break;
                }
                this.logger.warn('Fetch failed, retrying', { error });
            }
        }
        throw lastError;
    }

    protected async sendSingleRequest(spec: FetchRequestSpec): Promise<FetchResponseSpec> {
        switch (spec.mode) {
            case 'Fetch':
                return await this.sendFetchRequestWithTimeout(spec);
            case 'Node':
            case 'Node+Proxy':
            default:
                return await this.sendNodeRequest(spec, spec.mode === 'Node+Proxy');
        }
    }

    async sendFetchRequestWithTimeout(spec: FetchRequestSpec): Promise<FetchResponseSpec> {
        return await Promise.race([
            this.sendFetchRequest(spec),
            new Promise<any>((_, reject) => {
                setTimeout(() => {
                    const err = util.createError({
                        code: 'FetchTimeout',
                        message: 'Fetch request timed out',
                        retry: false,
                    });
                    reject(err);
                }, spec.timeout);
            }),
        ]);
    }

    async sendFetchRequest(spec: FetchRequestSpec): Promise<FetchResponseSpec> {
        const page = this.browser.page;
        const response = (await page.evaluateJson(async request => {
            const { method, url, headers, body } = request;
            const payload = ['GET', 'HEAD'].includes(method) ? undefined : String(body);
            const res = await window.fetch(url, {
                method,
                headers,
                body: payload,
                mode: 'cors',
            });
            // Convert response body to base64
            const arrayBuffer = await res.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const bodyBase64 = btoa(binary);
            const result: FetchResponseSpec = {
                url: res.url,
                status: res.status,
                statusText: res.statusText,
                headers: {},
                body: bodyBase64,
            };
            for (const [k, v] of res.headers) {
                result.headers[k] = v;
            }
            return result;
        }, spec)) as FetchResponseSpec;
        const bodyBuffer = Buffer.from(response.body, 'base64');
        response.body = await this.parseResponseBody(spec, bodyBuffer);
        return response;
    }

    async sendNodeRequest(spec: FetchRequestSpec, useProxy: boolean): Promise<FetchResponseSpec> {
        const { method, url, headers, body } = spec;
        const parsedUrl = new URL(url);
        const payload = ['GET', 'HEAD'].includes(method) ? undefined : String(body);
        const fetchOptions: RequestInit = {
            method,
            headers,
            body: payload,
            timeout: spec.timeout,
        };
        let agent: http.Agent | null = null;
        if (useProxy) {
            const proxyPort = this.proxy.getProxyPort();
            const ca = this.proxy.getCACertificates();
            agent =
                parsedUrl.protocol === 'https:'
                    ? new HttpsProxyAgent({ host: `127.0.0.1:${proxyPort}` }, { ca })
                    : new HttpProxyAgent({ host: `127.0.0.1:${proxyPort}` });
            (fetchOptions as any).agent = agent;
        }
        try {
            const res = await nodeFetch(url, fetchOptions);
            const buffer = await res.buffer();
            const response: FetchResponseSpec = {
                url: res.url,
                status: res.status,
                statusText: res.statusText,
                headers: {},
                body: await this.parseResponseBody(spec, buffer),
            };
            for (const [k, v] of res.headers) {
                response.headers[k] = v;
            }
            return response;
        } finally {
            if (agent) {
                agent.destroy();
            }
        }
    }

    protected async parseResponseBody(spec: FetchRequestSpec, buffer: Buffer): Promise<any> {
        if (spec.responseBodyFormat === 'blob') {
            return await this.blobs.createBlob(uuid.v4(), buffer);
        }
        return util.parseBodyData(buffer, spec.responseBodyFormat);
    }

}
