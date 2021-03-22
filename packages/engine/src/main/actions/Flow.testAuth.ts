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

import { Request } from '@automationcloud/request';

import { Action } from '../action';
import { params } from '../model';
import { CredentialsService } from '../services/credentials';

export class TestAuthAction extends Action {
    static $type = 'Flow.testAuth';
    static $icon = 'fas fa-circle';
    static $help = ``;

    @params.Credentials({
        label: 'Authentication',
        providerName: 'GitHub',
        icon: 'fab fa-github',
        configs: [
            {
                type: 'basic',
                passwordLabel: 'Access token',
                help: 'Create a new personal access token in "Settings" > "Developer settings" > "Personal access tokens".',
            },
            {
                type: 'bearer',
                help: 'Some more help text.'
            },
            {
                type: 'oauth2',
                // grantTypes: ['authorization_code', 'client_credentials', 'refresh_token'],
                authorizationUrl: 'https://github.com/login/oauth/authorize',
                tokenUrl: 'https://github.com/login/oauth/access_token',
                scopes: 'repo,'
            },
        ]
    })
    auth: unknown;

    get $credentials() {
        return this.$container.get(CredentialsService);
    }

    async exec() {
        const auth = await this.$credentials.getAuthAgent(this.auth);
        const request = new Request({
            baseUrl: 'https://api.github.com',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
            },
            auth,
        });
        const res = await request.get('/user');
        // eslint-disable-next-line no-console
        console.log(res);
    }
}
