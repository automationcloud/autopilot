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

import { stringConfig, Configuration } from '@automationcloud/cdp';
import { injectable, inject } from 'inversify';
import { RequestOptions, Request, OAuth2Agent } from '@automationcloud/request';

const AC_API_URL = stringConfig('AC_API_URL', 'http://api-router-internal');
const AC_API_TOKEN_URL = stringConfig('AC_API_TOKEN_URL', '');
const AC_API_CLIENT_ID = stringConfig('AC_API_CLIENT_ID', '');
const AC_API_CLIENT_KEY = stringConfig('AC_API_CLIENT_KEY', '');

@injectable()
export class ApiRequest {
    authAgent!: OAuth2Agent;
    request!: Request;

    constructor(
        @inject(Configuration)
        protected config: Configuration,
    ) {
        this.setup();
    }

    setup() {
        this.authAgent = new OAuth2Agent({
            tokenUrl: this.config.get(AC_API_TOKEN_URL),
            clientId: this.config.get(AC_API_CLIENT_ID),
            clientSecret: this.config.get(AC_API_CLIENT_KEY),
        });
        this.request = new Request({
            baseUrl: this.config.get(AC_API_URL),
            auth: this.authAgent,
        });
    }

    get(url: string, options: RequestOptions = {}) {
        return this.request.get(url, options);
    }

    post(url: string, options: RequestOptions = {}) {
        return this.request.post(url, options);
    }

    put(url: string, options: RequestOptions = {}) {
        return this.request.put(url, options);
    }

    delete(url: string, options: RequestOptions = {}) {
        return this.request.delete(url, options);
    }

}
