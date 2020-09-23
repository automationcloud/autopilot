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

import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import { NetworkResource } from '@automationcloud/cdp';

import URL from 'url';
import { NetworkResult } from '../common-types';

export class SelectNetworkResources extends Pipe {
    static $type = 'Browser.selectNetworkResources';
    static $help = `
Returns information about network requests and responses that match specified filters.

### Use For

- extracting data from ongoing network requests
`;

    @params.Enum({
        enum: [
            '*',
            'XHR',
            'Fetch',
            'Document',
            'Stylesheet',
            'Image',
            'Media',
            'Font',
            'Script',
            'TextTrack',
            'EventSource',
            'WebSocket',
            'Manifest',
            'SignedExchange',
            'Other',
        ],
        help: 'Filter by resource type (XHR and Fetch are most commonly used).',
    })
    resourceType: string = '*';

    @params.Enum({
        enum: ['*', '2xx', '3xx', '4xx', '5xx', '200', '201', '203', '204', '205', '206', '300', '301', '302'],
        help: 'Filter by response status code.',
    })
    statusCode: string = '2xx';

    @params.Enum({
        enum: ['*', 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        help: 'Filter by request method.',
    })
    method: string = '*';

    @params.String({
        help: 'Flob filter by hostname (* matches hostnames).',
    })
    hostnameRegexp: string = '.*';

    @params.String({
        help: 'Flob filter by request pathname (/** matches all pathnames).',
    })
    pathnameRegexp: string = '.*';

    @params.Enum({
        enum: ['none', 'json', 'urlencoded', 'text', 'base64'],
        help: `
If specified, the result will include parsed request body
(consider omitting if accessing request body is not required).
`,
    })
    requestBodyFormat: string = 'none';

    @params.Enum({
        enum: ['none', 'json', 'urlencoded', 'text', 'base64'],
        help: `
If specified, the result will include parsed response body
(consider omitting if accessing response body is not required).
`,
    })
    responseBodyFormat: string = 'none';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const results = [];
        for (const el of inputSet) {
            const resources = await this.collectNetworkResults(el);
            for (const res of resources) {
                results.push(el.clone(res));
            }
        }
        return results;
    }

    async collectNetworkResults(el: Element): Promise<NetworkResult[]> {
        const resourceType = this.resourceType;
        const statusCode = this.statusCode;
        const method = this.method;
        const hostnameRegexp = this.hostnameRegexp;
        const pathnameRegexp = this.pathnameRegexp;
        const requestBodyFormat = this.requestBodyFormat;
        const responseBodyFormat = this.responseBodyFormat;

        const resources = el.remote.page.networkManager.getCollectedResources();
        const results: NetworkResult[] = [];

        for (const rs of resources) {
            const { requestId, request, response } = rs;
            // Loading Status
            if (rs.status !== 'loadingFinished' || !response) {
                continue;
            }
            // Resource Type
            if (resourceType !== '*' && rs.type !== resourceType) {
                continue;
            }
            // Method
            if (method !== '*' && request.method !== method) {
                continue;
            }
            // Response Status
            if (!this.matchStatusCode(statusCode, response.status)) {
                continue;
            }
            // Parse URL
            const url = URL.parse(request.url);
            if (!new RegExp(`^${hostnameRegexp}$`).test(url.hostname || '')) {
                continue;
            }
            // Pathname
            if (!new RegExp(`^${pathnameRegexp}$`).test(url.pathname || '')) {
                continue;
            }
            // Prepare result object
            const requestBody = await this.readRequestBody(rs, requestBodyFormat);
            const responseBody = await this.readResponseBody(rs, responseBodyFormat);
            results.push({
                requestId,
                request: {
                    url: request.url,
                    method: request.method,
                    headers: request.headers,
                    body: requestBody,
                },
                response: {
                    url: response.url,
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    body: responseBody,
                },
            });
        }
        return results;
    }

    async readRequestBody(rs: NetworkResource, requestBodyFormat: string) {
        const { postData } = rs.request;
        if (!postData) {
            return null;
        }
        // TODO encoding is not actually defined by CDP; this may bite in esoteric cases.
        const buffer = Buffer.from(postData, 'utf-8');
        return await util.parseBodyData(buffer, requestBodyFormat);
    }

    async readResponseBody(rs: NetworkResource, responseBodyFormat: string) {
        try {
            const buffer = await this.$page.networkManager.getResponseBody(rs.requestId);
            return util.parseBodyData(buffer, responseBodyFormat);
        } catch (err) {
            // TODO log?
            return null;
        }
    }

    matchStatusCode(pattern: string, status: number) {
        switch (pattern) {
            case '*':
                return true;
            case '2xx':
                return status >= 200 && status < 300;
            case '3xx':
                return status >= 300 && status < 400;
            case '4xx':
                return status >= 400 && status < 500;
            case '5xx':
                return status >= 500;
            default:
                return Number(pattern) === status;
        }
    }
}
