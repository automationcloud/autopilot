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

import fetch from 'node-fetch';

const MAX_ATTEMPTS = 20;
const RETRY_INTERVAL = 3000;

const NETWORK_ERRORS = [
    'EAI_AGAIN',
    'EHOSTDOWN',
    'EHOSTUNREACH',
    'ECONNABORTED',
    'ECONNREFUSED',
    'ECONNRESET',
    'EPIPE',
];

export async function fetchWithRetry(fullUrl: string, spec: any): Promise<any> {
    let attempted = 0;
    let lastError = null;
    while (attempted < MAX_ATTEMPTS) {
        try {
            attempted += 1;
            return await fetch(fullUrl, spec);
        } catch (e) {
            if (NETWORK_ERRORS.includes(e.code)) {
                lastError = e;
                await new Promise(r => setTimeout(r, RETRY_INTERVAL));
            } else {
                throw e;
            }
        }
    }
    throw lastError;
}
