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
