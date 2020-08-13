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
