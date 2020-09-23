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

import { Exception } from '@automationcloud/cdp';
import { injectable } from 'inversify';

@injectable()
export class HttpCallbackService {

    getCallbackUrl(): string {
        throw new Exception({
            name: 'HttpCallbackUnavailable',
            message: 'Http callbacks are unavailable in current runtime',
            retry: false,
        });
    }

    async open(_url: string | URL): Promise<HttpCallbackResponse> {
        throw new Exception({
            name: 'HttpCallbackUnavailable',
            message: 'Http callbacks are unavailable in current runtime',
            retry: false,
        });
    }

}

export interface HttpCallbackResponse {
    method: string;
    url: string;
    query: Record<string, string>;
    headers: Record<string, string>;
    body: any;
}
