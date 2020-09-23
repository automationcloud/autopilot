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

import uuid from 'uuid';
import jsonPointer from 'jsonpointer';
import diacritics from 'diacritics';
import { assertScript } from './assert';
import { ScriptException } from '../exception';

export interface StringComparisonOptions {
    caseSensitive?: boolean;
    removeDiacritics?: boolean;
    collapseWhitespace?: boolean;
    onlyAlphaNumeric?: boolean;
}

export function getType(data: any): string {
    return data == null ? 'null' : Array.isArray(data) ? 'array' : data instanceof Buffer ? 'buffer' : typeof data;
}

export function checkType(data: any, expectedType: string | string[], variableName = 'Value'): void {
    const types: string[] = Array.isArray(expectedType) ? expectedType : [expectedType];
    const actualType = getType(data);
    if (!types.includes(actualType)) {
        const expectedTypes = types.join(' or ');
        const message = `${variableName} should be ${expectedTypes}, instead got ${actualType}`;
        throw new ScriptException({
            name: 'ValueTypeError',
            message,
            retry: true,
        });
    }
}

export function deepClone<T>(data: T): T {
    return data == null ? null : JSON.parse(JSON.stringify(data));
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

export function sortBy<T, K>(items: T[], fn: (item: T) => K): T[] {
    return items.slice().sort((a, b) => fn(a) > fn(b) ? 1 : -1);
}

export function cloneWithNewIds<T>(obj: T): T {
    const idsMap = new Map();
    // First stringify the object, replacing ids with new ones
    const str = JSON.stringify(obj, (key, value) => {
        if (key === 'id') {
            const newId = uuid.v4();
            // Keep track of oldId => newId mapping
            idsMap.set(value, newId);
            return newId;
        }
        return value;
    });
    // Next, parse JSON and revive all references to old ids
    return JSON.parse(str, (key, value) => {
        if (idsMap.has(value)) {
            return idsMap.get(value);
        }
        return value;
    });
}

export function cloneWithoutIdsCollision<T>(obj: T, existingIds: Set<string> | Map<string, any>): T {
    const idsMap = new Map();
    // First stringify the object, replacing ids with new ones
    const str = JSON.stringify(obj, (key, value) => {
        if (key === 'id' && existingIds.has(value)) {
            const newId = uuid.v4();
            // Keep track of oldId => newId mapping
            idsMap.set(value, newId);
            return newId;
        }
        return value;
    });
    // Next, parse JSON and revive all references to old ids
    return JSON.parse(str, (key, value) => {
        if (idsMap.has(value)) {
            return idsMap.get(value);
        }
        return value;
    });
}

export function anyEquals(a: any, b: any, options: StringComparisonOptions = {}): boolean {
    const aType = getType(a);
    const bType = getType(b);
    switch (aType) {
        case 'object':
            return (
                bType === 'object' &&
                Object.keys(a).length === Object.keys(b).length &&
                Object.keys(a).every(k => anyEquals(a[k], b[k], options))
            );
        case 'array':
            return (
                bType === 'array' &&
                a.length === b.length &&
                a.every((ca: any, i: number) => anyEquals(ca, b[i], options))
            );
        default:
            return strEquals(a, b, options);
    }
}

export function anyContains(a: any, b: any, options: StringComparisonOptions = {}): boolean {
    const aType = getType(a);
    const bType = getType(b);
    switch (aType) {
        case 'object':
            return bType === 'object' && Object.keys(b).every(k => anyEquals(a[k], b[k], options));
        case 'array':
            return bType === 'array' && b.every((cb: any) => a.some((ca: any) => anyEquals(ca, cb, options)));
        default:
            return strContains(a, b, options);
    }
}

export function strContains(actual: string, pattern: any, options: StringComparisonOptions = {}): boolean {
    if (typeof pattern.test === 'function') {
        return pattern.test(actual);
    }
    return weakString(actual, options).includes(weakString(pattern, options));
}

export function strEquals(a: string, b: string, options: StringComparisonOptions = {}): boolean {
    return weakString(a, options) === weakString(b, options);
}

export function weakString(str: string, options: StringComparisonOptions = {}): string {
    const {
        removeDiacritics = true,
        collapseWhitespace = true,
        onlyAlphaNumeric = false,
        caseSensitive = false,
    } = options;
    let val = castToString(str).trim();
    if (!caseSensitive) {
        val = val.toLowerCase();
    }
    if (collapseWhitespace) {
        val = val.replace(/\s+/g, ' ');
    }
    if (removeDiacritics) {
        val = diacritics.remove(val);
    }
    if (onlyAlphaNumeric) {
        val = val.replace(/[^a-z0-9]/gi, '');
    }
    return val;
}

export function castToString(str: any): string {
    if (str == null) {
        return 'null';
    }
    if (['string', 'number', 'boolean'].includes(typeof str)) {
        return String(str);
    }
    return JSON.stringify(str);
}

export function abbr(value: any) {
    const str = String(value || '');
    return str.length > 30 ? str.substring(0, 27) + '...' : str;
}

export function humanize(str: string): string {
    const s = str.replace(/[$_/-]/g, ' ').replace(/([A-Z])/g, ' $1');
    return capitalizeWords(s);
}

export function capitalize(str: string): string {
    return str.substring(0, 1).toUpperCase() + str.substring(1);
}

export function capitalizeWords(str: string): string {
    return str
        .replace(/\s+/, ' ')
        .toLowerCase()
        .replace(/( |^)([a-z])/g, (_, ws, char) => {
            return ws + char.toUpperCase();
        });
}

export function normalizeString(str: string): string {
    if (str == null) {
        return '';
    }
    return String(str)
        .replace(/\s+/g, ' ')
        .trim();
}

export function streamToBuffer(readable: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const buffers: Buffer[] = [];
        readable.on('data', (chunk: any) => {
            buffers.push(Buffer.from(chunk));
        });
        readable.on('end', () => {
            const buffer = Buffer.concat(buffers);
            resolve(buffer);
        });
        readable.on('error', (err: Error) => reject(err));
        readable.resume();
    });
}

export function convertObjectPointers(object: any): any {
    const newObj: any = {};
    for (const [key, value] of Object.entries(object)) {
        if (key[0] === '/') {
            jsonPointer.set(newObj, key, value);
        } else {
            newObj[key] = value;
        }
    }
    return newObj;
}

export function getConstant(dataType: 'string' | 'boolean' | 'number', value: string) {
    switch (dataType) {
        case 'string':
            return value;
        case 'boolean':
            assertScript(['true', 'false'].includes(value), 'Value should be either "true" or "false"');
            return value === 'true';
        case 'number': {
            const num = parseInt(value, 10);
            assertScript(!isNaN(num), 'Value is not a number');
            return num;
        }
        default:
            assertScript(false, `Unknown data type: ${dataType}`);
            break;
    }
}
