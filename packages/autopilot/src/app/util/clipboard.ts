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
import { clipboard } from 'electron';

export function readText() {
    return clipboard.readText() || '';
}

export function readObjectData(type?: string): any {
    const obj = readObject() || {};
    return type == null || obj.type === type ? obj.data : null;
}

export function readObject(): any {
    try {
        const obj = JSON.parse(clipboard.readText());
        return obj;
    } catch (err) {
        return null;
    }
}

export function writeObject(obj: any) {
    const text = JSON.stringify(obj, null, 4);
    clipboard.writeText(text);
}

export function writeText(text: string) {
    clipboard.writeText(text);
}

export function getObjectType(): string {
    const obj = readObject();
    return (obj && obj.type) || 'empty';
}

export function hasObjectType(type: string): boolean {
    return getObjectType() === type;
}

export function getUrl() {
    const text = clipboard.readText().trim();
    return util.parseUrl(text);
}
