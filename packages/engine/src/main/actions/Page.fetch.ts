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

import { Action } from '../action';
import { Pipeline } from '../pipeline';
import { Exception } from '@automationcloud/cdp';
import { params } from '../model';
import { FetchService, FetchRequestSpec, FetchResponseSpec } from '../services';

export const RETRIABLE_ERRORS = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE', 'ERR_STREAM_DESTROYED'];

export class SendNetworkRequestAction extends Action {
    static $type = 'Page.fetch';
    static $icon = 'fas fa-wifi';
    static $help = `
Sends a new network request from currently open webpage.

The request is configured using pipeline's output object (see below).
The pipeline should return a single element with object value, which configures the request.

The request follows Content Security Policy (CSP) of the current web page.
This can be a limiting factor, for example when trying to send a request to a domain which is not whitelisted
in \`Access-Control-Allow-Origin\` header (the same applies to other CORS and CSP headers).
If you are experiencing problems due to CORS and/or CSP, it is recommended to use "nodejs" or "nodejs+proxy" mode.

The request configuration object (the output value of pipeline) can consist of:

- \`method\`: HTTP request method; \`GET\`, \`POST\`, \`PUT\` or \`DELETE\` are used most commonly
- \`protocol\` (e.g. \`http:\`, \`https:\`)
- \`host\` (e.g. \`example.com\`, \`example.com: 3123\`)
- \`hostname\` (e.g. \`example.com\`)
- \`pathname\` (e.g. \`/path/to/resource\`)
- \`query\`: an object with query parameters (e.g. \`{ hello: 'world' }\`)
- \`headers\`: an object with headers (e.g. \`{ 'content-type': 'text/plain' }\`)
- \`body\`: an object which configures request body, depends on Request Body Format parameter:
  - none: the body is not included in request (the value is ignored)
  - json: the object is sent as JSON; content type header is set to \`application/json\`
    if not overridden with \`headers\`
  - urlencoded: the object is encoded in a similar way to \`query\` above and is sent in request body;
    content type header is set to \`application/x-www-form-urlencoded\` if not overridden with \`headers\`
  - multipart: the content type header is set to \`multipart/form-data\` and the request body is encoded
    as multipart/form-data stream following the rules:
      - each object key is a separate field
      - if the value is string, a text field is appended to form data
      - if the value is Blob object, the file field is appended to form data (see [Fetch Blob](#fetch-blob) for details)
  - text: the value is sent as a plain text

Note: it is handy to configure the request object using Compose pipe.

### Parameters

- mode: Fetch or XHR (Fetch is preferred, but XHR may be necessary if website replaces \`window.fetch\`
  with its own incompatible implementation)
- request body format: specifies how to treat \`/ body\` of request object (see above)
- response body format: specifies how to parse the response

### Use For

- advanced scripting, to send network requests manually
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    @params.Preview({
        label: 'Response Preview',
        placeholder: 'Run the action to send a request.',
    })
    $payload?: NetworkResult = undefined;

    @params.Enum({
        enum: ['Fetch', 'Node', 'Node+Proxy']
    })
    mode: 'Fetch' | 'Node' | 'Node+Proxy' = 'Fetch';

    @params.Boolean()
    rejectHttpErrors: boolean = true;

    @params.Enum({
        enum: ['none', 'json', 'urlencoded', 'multipart', 'text', 'base64']
    })
    requestBodyFormat: string = 'none';

    @params.Enum({
        enum: ['none', 'json', 'urlencoded', 'text', 'base64', 'blob']
    })
    responseBodyFormat: string = 'none';

    @params.Number({ min: 0 })
    timeout: number = 120000;

    @params.Number({ min: 0 })
    retries: number = 3;

    get $fetch() {
        return this.$engine.get(FetchService);
    }

    reset() {
        super.reset();
        this.$payload = undefined;
    }

    hasChildren() {
        return true;
    }

    async resolveChildrenScope() {
        if (!this.$payload) {
            return [];
        }
        const inputSet = await this.resolveScope();
        return inputSet.map(el => el.clone(this.$payload));
    }

    afterRun() {
        if (this.$runtime.bypassed) {
            this.skip();
        } else {
            this.enter();
        }
    }

    async exec() {
        const data = await this.retry(async () => {
            const el = await this.selectOne(this.pipeline);
            return el.value;
        });
        const requestSpec = await this.$fetch.prepareRequestSpec({
            mode: this.mode,
            requestBodyFormat: this.requestBodyFormat,
            responseBodyFormat: this.responseBodyFormat,
            timeout: this.timeout,
            retries: this.retries,
            ...data
        });
        const response = await this.$fetch.sendWithRetries(requestSpec);
        if (response!.status >= 400 && this.rejectHttpErrors) {
            throw new Exception({
                name: 'SendNetworkRequestFailed',
                message: `Request failed: HTTP ${response.status} ${response.statusText}`,
                retry: false,
            });
        }
        this.$payload = {
            request: requestSpec,
            response,
        };
    }

}

interface NetworkResult {
    request: FetchRequestSpec;
    response: FetchResponseSpec;
}
