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

// Coordinates

export interface BoxModel {
    content: Quad;
    padding: Quad;
    border: Quad;
    margin: Quad;
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
    zoom?: number;
}

export type Quad = [Point, Point, Point, Point];

// Target

export type CdpTargetType = 'page' | 'iframe' | 'background_page' | 'service_worker' | 'browser';

export interface CdpTargetInfo {
    targetId: string;
    type: CdpTargetType;
    url: string;
    title: string;
    browserContextId?: string;
}

// Page

export interface CdpFrameTree {
    frame: CdpFrame;
    childFrames: CdpFrameTree[];
}

export interface CdpFrame {
    id: string;
    parentId?: string;
    url: string;
    securityOrigin: string;
    mimeType: string;
    unreachableUrl?: string;
}

export interface CdpLayoutMetrics {
    layoutViewport: CdpLayoutViewport;
    visualViewport: CdpVisualViewport;
    contentSize: CdpRect;
}

export interface CdpLayoutViewport {
    pageX: number;
    pageY: number;
    clientWidth: number;
    clientHeight: number;
}

export interface CdpVisualViewport {
    offsetX: number;
    offsetY: number;
    pageX: number;
    pageY: number;
    clientWidth: number;
    clientHeight: number;
    scale: number;
    zoom: number;
}

// Network

export interface CdpHeaders {
    [name: string]: string;
}

export interface CdpRequestWillBeSent {
    requestId: string;
    type: string;
    frameId: string;
    request: CdpRequest;
}

export interface CdpRequest {
    url: string;
    method: string;
    headers: CdpHeaders;
    postData?: string;
}

export interface CdpResponseReceived {
    requestId: string;
    type: string;
    frameId: string;
    response: CdpResponse;
}

export interface CdpResponse {
    url: string;
    status: number;
    statusText: string;
    headers: CdpHeaders;
    headersText: string;
    mimeType: string;
    fromDiskCache: boolean;
}

export interface CdpLoadingFinished {
    requestId: string;
}

export interface CdpLoadingFailed {
    requestId: string;
    type: string;
    errorText: string;
    blockedReason?: string;
}

export interface CdpCookie {
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    size: number;
    httpOnly: boolean;
    secure: boolean;
    session: boolean;
    sameSite?: string;
}

export interface CdpRequestPaused {
    requestId: string;
    request: CdpRequest;
    frameId: string;
    resourceType: string;
    responseErrorReason?: string;
    responseStatusCode?: number;
    responseHeaders?: CdpHeaderEntry[];
    networkId?: string;
}

export type CdpNetworkErrorReason =
    | 'Failed'
    | 'Aborted'
    | 'TimedOut'
    | 'AccessDenied'
    | 'ConnectionClosed'
    | 'ConnectionReset'
    | 'ConnectionRefused'
    | 'ConnectionAborted'
    | 'ConnectionFailed'
    | 'NameNotResolved'
    | 'InternetDisconnected'
    | 'AddressUnreachable'
    | 'BlockedByClient'
    | 'BlockedByResponse';

export interface CdpHeaderEntry {
    name: string;
    value: string;
}

// Runtime

export interface CdpRemoteObject {
    type: 'object' | 'function' | 'undefined' | 'string' | 'number' | 'boolean' | 'symbol' | 'bigint';
    subtype?:
        | 'array'
        | 'null'
        | 'node'
        | 'regexp'
        | 'date'
        | 'map'
        | 'set'
        | 'weakmap'
        | 'weakset'
        | 'iterator'
        | 'generator'
        | 'error'
        | 'proxy'
        | 'promise'
        | 'typedarray';
    className?: string;
    value?: any;
    description?: string;
    objectId?: string;
}

// DOM

export interface CdpNode {
    nodeId: number;
    backendNodeId: string;
    parentId: number | null;
    ownerDocumentId: number | null;
    nodeType: number;
    nodeName: string;
    nodeValue: string;
    childNodeCount?: number;
    frameId?: string;
    attributes?: string[];
    documentURL?: string;
    baseURL?: string;
    pseudoType?: string;
    contentDocument?: any;
    children: CdpNode[] | null;
    pseudoElements: CdpNode[] | null;
}

export interface CdpRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CdpRGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

export type CdpQuad = [number, number, number, number, number, number, number, number];
