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

import { CdpHeaders } from '@automationcloud/cdp';

export interface RequestSpec {
    method: string;
    url: string;
    headers: CdpHeaders;
    body: string | null;
}

export interface ResponseSpec {
    url: string;
    status: number;
    statusText: string;
    headers: CdpHeaders;
    body: any | null;
}

export interface NetworkResult {
    requestId?: string;
    request: RequestSpec;
    response: ResponseSpec;
}
