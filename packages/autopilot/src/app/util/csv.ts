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

import csvStringify from 'csv-stringify/lib/sync';

export function toCsv(values: any[]) {
    const flat = [...flattenValues(values)];
    const keys = collectKeys(flat);
    const records = createRecords(flat, keys);
    const csv = csvStringify([keys].concat(records));
    return csv;
}

function* flattenValues(values: any[]): Iterable<any> {
    for (const val of values) {
        if (!isObjectOrArray(val)) {
            continue;
        }
        if (Array.isArray(val)) {
            yield* flattenValues(val);
        }
        yield val;
    }
}

/**
 * Collects all keys from the collection, trying to preserve the order in which they appear in objects.
 */
function collectKeys(values: any[]): string[] {
    const keys: string[] = [];
    for (const val of values) {
        if (!isObject(val)) {
            continue;
        }
        for (const key of Object.keys(val)) {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }
    }
    return keys;
}

function createRecords(values: any[], keys: string[]): any[][] {
    const records = [];
    for (const val of values) {
        if (!isObject(val)) {
            continue;
        }
        const record: any[] = [];
        records.push(record);
        for (const key of keys) {
            let cell = val[key];
            if (typeof cell === 'object') {
                cell = JSON.stringify(cell);
            }
            record.push(cell);
        }
    }
    return records;
}

function isObject(val: any): boolean {
    return isObjectOrArray(val) && !Array.isArray(val);
}

function isObjectOrArray(val: any): boolean {
    return val != null && typeof val === 'object';
}
