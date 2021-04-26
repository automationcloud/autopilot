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
import * as r from '@automationcloud/request';

import { Action } from './action';
import { ConnectorEndpoint } from './connector';
import { params } from './model';
import { Pipeline } from './pipeline';
import { CredentialsConfig, CredentialsService } from './services';
import * as util from './util';

export abstract class ConnectorAction extends Action {
    abstract getBaseUrl(): string;
    abstract getEndpoint(): ConnectorEndpoint;

    auth!: CredentialsConfig | null;

    @params.Pipeline({
        label: 'Parameters',
    })
    pipeline!: Pipeline;

    @params.Outcome({
        label: 'Result',
        placeholder: 'Run the action to see the outcome value.',
    })
    $outcome: any = undefined;

    init(spec: any) {
        super.init(spec);
        const { auth } = spec;
        this.auth = auth ?? null;
        if (this.pipeline.length === 0) {
            const mappings = this.$endpoint.parameters.map(param => {
                return {
                    path: '/' + param.key,
                    value: `// ${param.required ? '(Required) ' : '' }${param.description}`
                };
            });
            this.pipeline = new Pipeline(this, 'pipeline', [
                {
                    type: 'Object.compose',
                    mappings,
                }
            ]);
        }

    }

    get $credentials() { return this.$engine.get(CredentialsService); }

    get $baseUrl() { return this.getBaseUrl(); }

    get $endpoint() { return this.getEndpoint(); }

    reset() {
        super.reset();
        this.$outcome = undefined;
    }

    async exec() {
        // evaluate the parameters pipeline
        const data = await this.retry(async () => {
            const el = await this.selectOne(this.pipeline);
            return el.value;
        });
        util.checkType(data, 'object', 'Parameters');
        const { options, path } = this.getRequestSpec(data);
        const { method } = this.$endpoint;
        const auth = await this.$credentials.getAuthAgent(this.auth);
        const request = new r.Request({
            baseUrl: this.$baseUrl,
            auth,
        });
        const response = await request.sendRaw(method, path, options);
        const body = await response.text();
        this.$outcome = {
            url: response.url,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            body,
        };
    }

    // compose request options and path by reading location and type of the parameters
    getRequestSpec(evaluatedParams: any) {
        let isFormData = false;
        let path = this.$endpoint.path;
        const options: r.RequestOptions = {
            headers: {
                'content-type': 'application/json'
            }
        };
        // merge the evaluated parameters with parameter definitions from the spec
        for (const param of this.$endpoint.parameters) {
            const { key } = param;
            const val = evaluatedParams[key] ?? param.default;
            if (!val) {
                if (param.required) {
                    throw util.createError({
                        code: 'ParameterValidationError',
                        message: `Parameter \`${key}\` is required`,
                        details: {
                            parameters: evaluatedParams
                        },
                        retry: false,
                    });
                }
                continue;
            }
            switch (param.location) {
                case 'header':
                    options.headers = { ...options.headers, [key]: val };
                    break;
                case 'query':
                    options.query = { ...options.query, [key]: val };
                    break;
                case 'path':
                    path = path.replace(`{${key}}`, val); // spec must specify the path param with curly bracket e.g. /foo/{key}/bar
                    break;
                case 'body':
                    options.body = { ...options.body, [key]: val };
                    break;
                case 'formData':
                    isFormData = true;
                    options.body = { ...options.body, [key]: val };
                    break;
            }
        }
        // convert body
        if (isFormData) {
            options.headers!['content-type'] = 'application/x-www-form-urlencoded';
            options.body = new URLSearchParams(options.body ?? {});
        }
        options.body = options.body != null ? JSON.stringify(options.body) : null;
        return { options, path };
    }

}
