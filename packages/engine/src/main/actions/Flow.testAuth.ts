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
import { params } from '../model';
import { CredentialsService } from '../services/credentials';

export class TestAuthAction extends Action {
    static $type = 'Flow.testAuth';
    static $icon = 'fas fa-circle';
    static $help = ``;

    @params.Credentials({
        label: 'Basic',
        providerName: 'Some Service',
        icon: '',
        config: { type: 'basic' },
    })
    authBasic: unknown;

    @params.Credentials({
        label: 'OAuth2',
        providerName: 'GitHub',
        icon: 'fab fa-github',
        config: {
            type: 'oauth2',
            authorizationUrl: 'https://github.com/login/oauth/authorize',
            tokenUrl: 'https://github.com/login/oauth/access_token',
            scopes: 'repo,'
        }
    })
    authOauth2: unknown;

    get $credentialsService() {
        return this.$container.get(CredentialsService);
    }

    async exec() {
        // TODO work!

    }
}
