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

import URL from 'url';
import querystring from 'querystring';
import { assertPlayback, assertScript } from './assert';
import colorParser from 'parse-color';
import * as price from './price';

export interface ParsedUrl {
    href: string;
    protocol: string;
    host: string;
    hostname: string;
    port: string | null;
    pathname: string;
    hash: string | null;
    query: { [key: string]: any };
}

export interface Price {
    value: number;
    currencyCode: string;
}

export function parsePrice(text: string, parseNegative: boolean = false): Price | null {
    const p = price.parseFirst(text, { parseNegative });
    return p ? {
        value: p.value,
        currencyCode: p.currencyCode,
    } : null;
}

export function parsePriceAll(text: string, parseNegative = false): Price[] {
    return price.parseAll(text, { parseNegative }).map(p => {
        return {
            value: p.value,
            currencyCode: p.currencyCode,
        };
    });
}

export function parseUrl(url: string): ParsedUrl | null {
    const parsed = URL.parse(url);
    const {
        href = null,
        protocol = null,
        hostname = null,
        host = null,
        port = null,
        pathname = null,
        hash = null,
    } = parsed;
    if (href && protocol && host && hostname && pathname) {
        const query = querystring.parse(parsed.query || '');
        return {
            href,
            protocol,
            hostname,
            host,
            port,
            pathname,
            hash,
            query,
        };
    }
    // Parsing failed
    return null;
}

export function formatUrl(obj: any): string {
    const { url = '', query = {}, protocol, hostname, host, pathname, hash } = obj;
    const parsedUrl = URL.parse(url);
    assignOverrides(parsedUrl, { protocol, hostname, host, pathname, hash });
    if (!parsedUrl.protocol) {
        parsedUrl.protocol = 'http:';
    }
    assertPlayback(parsedUrl.hostname || parsedUrl.host, 'url or host is required');
    const parsedQuery = querystring.parse(parsedUrl.query || '');
    Object.assign(parsedQuery, query);
    const qs = querystring.stringify(parsedQuery);
    parsedUrl.search = qs ? '?' + qs : '';
    return URL.format(parsedUrl);
}

function assignOverrides(object: any, overrides: any): void {
    for (const key of Object.keys(overrides)) {
        const value = overrides[key];
        if (value) {
            object[key] = value;
        }
    }
}

export function parseColor(str: string): any {
    const color = colorParser(str);
    return color.rgb ? color : null;
}

export function parseBodyData(buffer: Buffer, format: string): any {
    switch (format) {
        case 'none':
            return null;
        case 'text':
            return buffer.toString('utf-8');
        case 'base64':
            return buffer.toString('base64');
        case 'json':
            return JSON.parse(buffer.toString('utf-8'));
        case 'urlencoded':
            return querystring.parse(buffer.toString('utf-8'));
        default:
            assertScript(false, `Unknown body format: ${format}`);
    }
}
