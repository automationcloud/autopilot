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

import { numberConfig } from '@automationcloud/cdp';
import { Script } from './script';

const RETRY_TIMEOUT_MIN = numberConfig('RETRY_TIMEOUT_MIN', 3000);
const RETRY_TIMEOUT_MAX = numberConfig('RETRY_TIMEOUT_MAX', 30000);
const RETRY_INTERVAL = numberConfig('RETRY_INTERVAL', 100);
const RETRY_NS_MARGIN = numberConfig('RETRY_NS_MARGIN', 1000);

/**
 * @param script
 * @param asyncFn
 * @param options
 * @internal
 */
export async function retry<T>(script: Script, asyncFn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const config = script.$config;
    const page = script.$page;
    const {
        retryTimeoutMin = config.get(RETRY_TIMEOUT_MIN),
        retryTimeoutMax = config.get(RETRY_TIMEOUT_MAX),
        retryInterval = config.get(RETRY_INTERVAL),
        retryNetworkSilenceMargin = config.get(RETRY_NS_MARGIN),
    } = options;

    let lastError = null;

    const startedAt = Date.now();
    const timeoutAt = startedAt + retryTimeoutMax;
    while (Date.now() <= timeoutAt) {
        try {
            return await asyncFn();
        } catch (e) {
            lastError = e;
            // Only retry on specific errors
            const retriable = e.retry;
            // Do not allow nested retries
            if (!retriable) {
                throw e;
            }
            // If network is silent for long enough, let's fail faster
            const failFast =
                page.networkManager.isSilentFor(retryNetworkSilenceMargin) && startedAt + retryTimeoutMin < Date.now();
            if (failFast) {
                throw e;
            }
        }
        await script.tick();
        await new Promise(r => setTimeout(r, retryInterval));
    }

    // All attempts fail
    throw lastError;
}

export interface RetryOptions {
    retryTimeoutMin?: number;
    retryTimeoutMax?: number;
    retryInterval?: number;
    retryNetworkSilenceMargin?: number;
}
