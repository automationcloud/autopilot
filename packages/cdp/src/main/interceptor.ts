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

import uuid from 'uuid';
import { Page } from './page';
import { Browser } from './browser';
import { CdpRequest, CdpRequestPaused, CdpHeaderEntry, CdpNetworkErrorReason, CdpHeaders } from './types';
import { convertHeadersToEntries, convertHeadersToObject } from './util';

export type InterceptorScope = Page | Browser;
export type InterceptorHandler = (req: InterceptedRequest) => Promise<InterceptorOutcome | void>;

/**
 * Manages request interception.
 *
 * Most common use cases require request interception to span across all connected targets.
 * Additionally, request interception may be required by multiple unrelated logical parts
 * of the automation.
 *
 * To address these concerns, Automation Engine includes modular request interception APIs
 * with following features:
 *
 * - interception can be enabled either for individual page (via `Page.interceptRequests`),
 *   or for all pages (vai `Browser.interceptRequests`)
 * - multiple interceptors can be stacked together; interception callback allows
 *   passing request further along the interceptors chain (with or without modifications),
 *   as well as handling the request exclusively (e.g. by fulfilling it with custom response,
 *   or aborting it, or sending it with or without modifications bypassing next interceptors)
 * - interceptors can be added and removed dynamically via synchronous APIs to minimize race
 *   conditions
 * - callbacks are executed asynchronously, allowing for custom I/O in handlers
 *
 * ### Details
 *
 * - Each opened target enables request interception from very beginning, sending `Fetch.enable`.
 *   Note that only `Request` stage interception is currently supported
 *   (which means we can't fire request onwards and later modify the response).
 * - Request interceptors are installed via `Browser#interceptRequests` or `Page#interceptRequests`.
 * - Interceptors are processed in the same order as installed, global interceptors always take precedence
 *   over local (Page-specific) ones.
 * - Each interceptor's handler is executed for each request.
 * - Handler may produce an outcome which *immediately* results in one of
 *   `fulfillResponse`, `failRequest` or `continueRequest` commands being sent and
 *   subsequent interceptors *not* invoked.
 * - If handler does not return an outcome, the request is passed onwards to the next interceptor and so forth —
 *   until the end of interceptors chain.
 * - At the end, if no interceptors produced an outcome, the request is resumed unmodified
 *   (as per normal browser behaviour).
 * - Handler can return an outcome by invoking one of the `InterceptedRequest` methods and returning its results.
 */
export class Interceptor {
    id: string = uuid.v4();

    constructor(public scope: InterceptorScope, public handler: InterceptorHandler, public label: string) {}

    /**
     * Removes this interceptor from the chain.
     *
     * Note: this does not terminate any active interception callbacks; rather,
     * the callback will no longer be called for new requests.
     */
    stop() {
        const i = this.scope.interceptors.findIndex(_ => _.id === this.id);
        if (i > -1) {
            this.scope.interceptors.splice(i, 1);
        }
    }
}

/**
 * An instance of intercepted request.
 *
 * Methods of this class create interception outcomes (return values of interception callback).
 *
 * Modifying instance properties and calling `pass` allows passing
 * modified version of request further along the chain of interceptors.
 */
export class InterceptedRequest {
    requestId: string;
    frameId: string;
    resourceType: string;
    request: CdpRequest;
    responseErrorReason?: string;
    responseStatusCode?: number;
    responseHeaders?: CdpHeaderEntry[];
    networkId?: string;

    protected modifications: InterceptorModifications = {};

    constructor(public page: Page, payload: CdpRequestPaused) {
        this.requestId = payload.requestId;
        this.frameId = payload.frameId;
        this.resourceType = payload.resourceType;
        this.request = payload.request;
        this.responseErrorReason = payload.responseErrorReason;
        this.responseStatusCode = payload.responseStatusCode;
        this.responseHeaders = payload.responseHeaders;
    }

    /**
     * Aborts the request with specified error reason.
     * If the request is used for navigation, Chrome will display one of its predefined error pages
     * based on provided reason.
     *
     * @param errorReason CDP error reason.
     */
    fail(errorReason: CdpNetworkErrorReason): InterceptorOutcome {
        return {
            method: 'Fetch.failRequest',
            params: {
                requestId: this.requestId,
                errorReason,
            },
        };
    }

    /**
     * Fulfils the request with custom response.
     * The request will not be sent and will not be propagated to next interceptors.
     *
     * @param response Reponse data to fulfil the request with.
     */
    fulfill(response: InterceptorResponse): InterceptorOutcome {
        const { responseCode, responseHeaders, body } = response;
        const params: any = {
            requestId: this.requestId,
            responseCode,
            responseHeaders: responseHeaders ? convertHeadersToEntries(responseHeaders) : undefined,
        };
        // Note: Fetch.fulfillResponse expects base64-encoded string
        if (body) {
            const bodyBuffer = body instanceof Buffer ? body : Buffer.from(body);
            params.body = bodyBuffer.toString('base64');
        }
        return {
            method: 'Fetch.fulfillRequest',
            params,
        };
    }

    /**
     * Sends the request with optional modifications.
     * The request will bypass next interceptors in chain.
     *
     * In most cases `pass` should be used instead, to allow interceptors stacking.
     * Use `continue` only when processing the request by other interceptors is undesired.
     *
     * @param mods Optional request modifications.
     */
    continue(mods: InterceptorModifications = {}): InterceptorOutcome {
        this.assignModifications(mods);
        const { method, url, postData } = this.modifications;
        return {
            method: 'Fetch.continueRequest',
            params: {
                requestId: this.requestId,
                method,
                url,
                postData,
                headers: this.getEffectiveHeaderEntries(),
            },
        };
    }

    /**
     * Passes request further down the interception chain.
     * If there are no more interceptors, the request will be sent
     * with current modifications applied.
     *
     * This should be a default interceptor outcome for most cases, unless
     * the interceptor specifically wants to avoid any other interceptors
     * to alter request behavior (in such case `continue` should be used).
     *
     * @param mods Optional request modifications.
     */
    pass(mods: InterceptorModifications = {}): InterceptorOutcome {
        this.assignModifications(mods);
        return {
            method: 'pass',
            params: {},
        };
    }

    getEffectiveHeaders(): CdpHeaders | undefined {
        if (this.modifications.headers) {
            return convertHeadersToObject(this.modifications.headers);
        }
        if (this.modifications.extraHeaders) {
            return {
                ...this.request.headers,
                ...convertHeadersToObject(this.modifications.extraHeaders),
            };
        }
        return undefined;
    }

    getEffectiveHeaderEntries(): CdpHeaderEntry[] | undefined {
        const headers = this.getEffectiveHeaders();
        return headers ? convertHeadersToEntries(headers) : undefined;
    }

    protected assignModifications(mods: InterceptorModifications) {
        if (mods.method) {
            this.modifications.method = mods.method;
        }
        if (mods.url) {
            this.modifications.url = mods.url;
        }
        if (mods.postData) {
            this.modifications.postData = mods.postData;
        }
        if (mods.headers) {
            this.modifications.headers = convertHeadersToObject(mods.headers);
        }
        // Extra headers are merged with previously defined ones
        if (mods.extraHeaders) {
            this.modifications.extraHeaders = {
                ...this.modifications.extraHeaders,
                ...convertHeadersToObject(mods.extraHeaders),
            };
        }
    }
}

/**
 * Interceptor outcome, produced by methods on `InterceptedRequest`.
 *
 * @internal
 */
export interface InterceptorOutcome {
    method: string;
    params: any;
}

/**
 * Response data for fulfilling the request with custom response.
 */
export interface InterceptorResponse {
    responseCode: number;
    responseHeaders?: CdpHeaders;
    body?: string | Buffer;
}

/**
 * Represents request fields that can be modified.
 */
export interface InterceptorModifications {
    /**
     * If specified, request URL will be modified.
     */
    url?: string;
    /**
     * If specified, request method will be modified.
     */
    method?: string;
    /**
     * If specified, request post data will be modified.
     */
    postData?: string;
    /**
     * If specified, extra headers are added to request.
     */
    extraHeaders?: CdpHeaders;
    /**
     * If specified, request headers are replaced.
     * Note: this replaces headers completely, with any extra headers discarded.
     */
    headers?: CdpHeaders;
}
