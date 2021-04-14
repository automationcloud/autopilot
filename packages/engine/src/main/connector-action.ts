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

import { params, util } from '.';
import { Action } from './action';
import { ConnectorSpec } from './connector';
import { Pipeline } from './pipeline';
import { CredentialsConfig, CredentialsService } from './services';

export class ConnectorAction extends Action {
    $spec!: ConnectorSpec;

    @params.Credentials({
        label: 'Auth',
        providerName: '',
        configs: []
    })
    auth!: CredentialsConfig;

    @params.Pipeline({
        label: 'Parameters',
    })
    pipeline!: Pipeline;

    @params.Outcome({
        label: 'Result',
        placeholder: 'Run the action to see the outcome value.',
    })
    $outcome: any = undefined;

    $params: any = {}; // default parameter value

    get $credentials() {
        return this.$engine.get(CredentialsService);
    }

    async exec() {
        // evaluate auth parameter, create auth agent from it using CredentialsService
        const auth = await this.$credentials.getAuthAgent(this.auth);
        // evaluate the parameters pipeline
        const data = await this.retry(async () => {
            const el = await this.selectOne(this.pipeline);
            return el.value;
        });
        util.checkType(data, 'object', 'Parameters');
        // merge the evaluated parameters with parameter definitions from the spec
        const parameters = {
            ...this.$params,
            ...data,
        };
        // compose request body by reading location and type of the resulting parameters
        let path = this.$spec.path;
        let isFormData = false;
        const options: r.RequestOptions = {
            headers: {
                'content-type': 'application/json'
            }
        };
        // also checks required.
        for (const param of this.$spec.parameters) {
            const { key } = param;
            const val = parameters[key];
            if (!val) {
                if (param.required) {
                    throw util.scriptError(`Parameter ${key} is required`, { detail: parameters });
                }
                continue;
            }
            if (param.location === 'formData') {
                isFormData = true;
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
                case 'formData':
                    options.body = { ...options.body, [key]: val };
                    break;
            }
        }
        // convert body
        if (isFormData) {
            options.headers!['content-type'] = 'application/x-www-form-urlencoded';
            options.body = new URLSearchParams(options.body ?? {});
        } else {
            options.body = options.body != null ? JSON.stringify(options.body) : null;
        }

        // send the resulting request
        const request = new r.Request({
            baseUrl: this.$spec.baseUrl,
            auth,
        });

        this.$outcome = await request.sendRaw(this.$spec.method, path, options);
        // store the response in Result outcome parameter
    }

}
