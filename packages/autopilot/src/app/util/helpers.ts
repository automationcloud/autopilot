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

import { util } from '@automationcloud/engine';
import fs from 'fs';
import rimraf from 'rimraf';
import { promisify } from 'util';
import mkdirp from 'mkdirp';
import Json5 from 'json5';
import marked from 'marked';
import sanitize from 'sanitize-html';

export const rimrafAsync = promisify(rimraf);
export const mkdirpAsync = promisify(mkdirp);
export const writeFileAsync = promisify(fs.writeFile);
export const readFileAsync = promisify(fs.readFile);
export const readdirAsync = promisify(fs.readdir);

export function parseJson(str: string): any {
    return Json5.parse(str);
}

export function createEditProxy(object: any, editFn: (key: string, newValue: string) => void): any {
    const proxy: any = {};
    for (const key of Object.keys(object)) {
        if (key[0] === '$' || key[0] === '_') {
            continue;
        }
        Object.defineProperty(proxy, key, {
            get() {
                return object[key];
            },
            set(val) {
                editFn(key, val);
            },
        });
    }
    return proxy;
}

export function parseJsonOrNull(text: string): any {
    try {
        return JSON.parse(text);
    } catch (err) {
        return null;
    }
}

export function formatDuration(val: number): string {
    const ms = val % 1000;
    const s = Math.floor(val / 1000) % 60;
    const m = Math.floor(val / 60000) % 60;
    const h = Math.floor(val / 3600000);
    return (
        [
            [h, 'h'],
            [m, 'm'],
            [s, 's'],
            [ms, 'ms'],
        ]
            .filter(p => p[0] > 0)
            .slice(0, 2)
            .map(p => p.join(''))
            .join(' ') || '0ms'
    );
}

export function createComposeMappings(object: any) {
    const pointers = collectPointers(object, {
        emitObjects: false,
    });
    return pointers.map(ptr => {
        return {
            path: ptr.path,
            value: escapeComposeValue(ptr.value),
        };
    });
}

export function createComposeMappingsFlat(object: any, pathPrefix = '') {
    const mappings = [];
    for (const key of Object.keys(object)) {
        const path = `${pathPrefix}/${key}`;
        const value = escapeComposeValue(object[key]);
        mappings.push({
            path,
            value,
        });
    }
    return mappings;
}

export function escapeComposeValue(value: string): string {
    if (typeof value === 'string' && !['/', '='].includes(value[0])) {
        return value;
    }
    return '=' + JSON.stringify(value);
}

export function biasedFuzzySearch<T>(term: string, values: T[], keyFn: (value: T) => string): T[] {
    term = term.trim().toLowerCase();
    const res: Array<{ value: T; score: number }> = [];
    for (const value of values) {
        const key = keyFn(value)
            .trim()
            .toLowerCase();
        const score = biasedFuzzyMatch(term, key);
        if (score === -1) {
            continue;
        }
        res.push({ value, score });
    }
    return res.sort((a, b) => b.score - a.score).map(_ => _.value);
}

export function biasedFuzzyMatch(term: string, value: string): number {
    term = term.trim().toLowerCase();
    value = value.trim().toLowerCase();
    let found = true;
    let score = 0;
    let fromIdx = 0;
    for (const char of term) {
        const idx = value.indexOf(char, fromIdx);
        if (idx === -1) {
            found = false;
            break;
        }
        score += idx === fromIdx ? 100 : value.length - idx - fromIdx;
        fromIdx = idx + 1;
    }
    if (!found) {
        score = -1;
    }
    return score;
}

export interface CollectPointersOptions {
    emitObjects?: boolean;
    expandObjects?: boolean;
    emitArrays?: boolean;
    expandArrays?: boolean;
}

export function collectPointers(
    object: any,
    options: {
        emitObjects?: boolean;
        expandObjects?: boolean;
        emitArrays?: boolean;
        expandArrays?: boolean;
    } = {},
): Array<{ path: string; value: any }> {
    const { emitObjects = true, expandObjects = true, emitArrays = true, expandArrays = false } = options;

    const results: Array<{ path: string; value: any }> = [];
    _collect('/', object);
    return results;

    function _collect(prefix: string, obj: any) {
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            const type = util.getType(value);
            switch (type) {
                case 'object':
                    if (emitObjects) {
                        results.push({ path: prefix + key, value });
                    }
                    if (expandObjects) {
                        _collect(prefix + key + '/', value);
                    }
                    break;
                case 'array':
                    if (emitArrays) {
                        results.push({ path: prefix + key, value });
                    }
                    if (expandArrays) {
                        _collect(prefix + key + '/', value);
                    }
                    break;
                default:
                    results.push({ path: prefix + key, value });
            }
        }
    }
}

export function commonStringPrefix(s1: string, s2: string) {
    const l = Math.min(s1.length, s2.length);
    for (let i = 0; i < l; i++) {
        if (s1.charAt(i) !== s2.charAt(i)) {
            return s1.substring(0, i);
        }
    }
    return s1.substring(0, l);
}

export function groupBy<T, K>(items: T[], fn: (item: T, index: number) => K): Array<[K, T[]]> {
    const map: Map<K, T[]> = new Map();
    for (const [i, item] of items.entries()) {
        const key = fn(item, i);
        const list = map.get(key);
        if (list) {
            list.push(item);
        } else {
            map.set(key, [item]);
        }
    }
    return [...map.entries()];
}

export function makeSafeString(str: string, others: string[]): string {
    if (!others.includes(str)) {
        return str;
    }
    let num = 0;
    const prefix = str.replace(/\.(\d+)$/, (_, n) => {
        num = parseInt(n, 10) || 0;
        return '';
    });
    return makeSafeString(`${prefix}.${num + 1}`, others);
}

export function isUuid(str: string) {
    const r = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89AB][0-9a-f]{3}-[0-9a-f]{12}$', 'i');
    return r.test(str);
}

export function mdToHtml(text: string) {
    const html = marked(text);
    return sanitize(html, {
        allowedTags: ['b', 'i', 'em', 'strong', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'hr', 'code', 'pre', 'a'],
    });
}
