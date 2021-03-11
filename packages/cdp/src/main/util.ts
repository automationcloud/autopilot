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

import { CdpHeaderEntry, CdpHeaders, CdpQuad, Point, Quad } from './types';

export async function asyncRegexpReplace(
    str: string,
    regexp: RegExp,
    replacer: (m: RegExpExecArray) => string | Promise<string>,
): Promise<string> {
    const matches: RegExpExecArray[] = [];
    regexp.lastIndex = 0;
    let m = regexp.exec(str);
    while (m) {
        matches.push(m);
        if (!regexp.flags.includes('g')) {
            break;
        }
        m = regexp.exec(str);
    }
    const replacements = await Promise.all(matches.map(m => replacer(m)));
    let result = str;
    let offset = 0;
    for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        const r = replacements[i];
        const index = m.index + offset;
        const length = m[0].length;
        result = result.substring(0, index) + r + result.substring(index + length);
        offset = offset + r.length - length;
    }
    return result;
}

export function rectToQuad(rect: DOMRect): Quad {
    return [
        { x: rect.left, y: rect.top },
        { x: rect.left + rect.width, y: rect.top },
        { x: rect.left + rect.width, y: rect.top + rect.height },
        { x: rect.left, y: rect.top + rect.height },
    ];
}

export function fromCdpQuad(quad: CdpQuad): Quad {
    return [
        { x: quad[0], y: quad[1] },
        { x: quad[2], y: quad[3] },
        { x: quad[4], y: quad[5] },
        { x: quad[6], y: quad[7] },
    ];
}

export function computeQuadArea(quad: Quad) {
    // https://en.wikipedia.org/wiki/Polygon#Simple_polygons
    let area = 0;
    for (let i = 0; i < quad.length; i++) {
        const p1 = quad[i];
        const p2 = quad[(i + 1) % quad.length];
        area += (p1.x * p2.y - p2.x * p1.y) / 2;
    }
    return area;
}

export function quadCenterPoint(quad: Quad): Point {
    let x = 0;
    let y = 0;
    for (const point of quad) {
        x += point.x;
        y += point.y;
    }
    return {
        x: x / 4,
        y: y / 4,
    };
}

export function arePointsEqual(a: Point, b: Point) {
    return a.x === b.x && a.y === b.y;
}

export function findVisibleQuad(quads: Quad[], viewportWidth: number, viewportHeight: number): Quad | null {
    for (const quad of quads) {
        const trimmedQuad = quad.map(p => {
            return {
                x: clamp(p.x, 0, viewportWidth),
                y: clamp(p.y, 0, viewportHeight),
            };
        }) as Quad;
        if (computeQuadArea(trimmedQuad) > 0) {
            return trimmedQuad;
        }
    }
    return null;
}

export function clamp(number: number, min: number, max: number): number {
    return Math.min(Math.max(Number(number || 0), min), max);
}

export function convertHeadersToEntries(headers: CdpHeaders | CdpHeaderEntry[]): CdpHeaderEntry[] {
    if (Array.isArray(headers)) {
        return headers;
    }
    return Object.entries(headers).map(entry => {
        return {
            name: entry[0],
            value: entry[1],
        };
    });
}

export function convertHeadersToObject(headers: CdpHeaders | CdpHeaderEntry[]): CdpHeaders {
    if (Array.isArray(headers)) {
        const result: CdpHeaders = {};
        for (const { name, value } of headers) {
            result[name] = value;
        }
        return result;
    }
    return headers;
}
