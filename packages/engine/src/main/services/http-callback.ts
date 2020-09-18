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
