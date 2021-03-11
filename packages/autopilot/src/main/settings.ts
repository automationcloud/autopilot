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

import debounce from 'debounce-promise';
import { promises as fs, readFileSync } from 'fs';
import os from 'os';
import path from 'path';
import uuid from 'uuid';

const DEFAULT_SETTINGS: Settings = {
    instanceId: uuid.v4(),
    channel: 'stable',
    lastProfileId: 'default',
    profiles: [newProfile('default', 'Default')],
};
const settingsFile = path.resolve(os.homedir(), '.autopilot', 'settings.json');
const settings = loadSettingsSync();
const saveSettings = debounce(_saveSettings, 300);
saveSettings();

export interface Settings {
    instanceId: string;
    lastProfileId: string;
    profiles: Profile[];
    channel: 'stable' | 'beta';
}

export interface Profile {
    id: string;
    name: string;
    width: number;
    height: number;
    x: number;
    y: number;
}

function loadSettingsSync(): Settings {
    const settings: Settings = { ...DEFAULT_SETTINGS };
    try {
        const text = readFileSync(settingsFile, 'utf-8');
        const json = JSON.parse(text);
        Object.assign(settings, json);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.warn(err);
        }
    }
    return settings;
}

async function _saveSettings() {
    const dir = path.dirname(settingsFile);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
}

export function getSettings() {
    return settings;
}

export function getAllProfiles(): Profile[] {
    return settings.profiles.length > 0 ? settings.profiles : [newProfile('default', 'Default')];
}

export function getProfile(id: string): Profile | null {
    return settings.profiles.find(_ => _.id === id) ?? null;
}

export function getLastProfile(): Profile {
    const { profiles, lastProfileId } = settings;
    const profile = profiles.find(_ => _.id === lastProfileId);
    return profile || profiles[0];
}

export function setLastProfile(id: string) {
    settings.lastProfileId = id;
    saveSettings();
}

export function updateProfile(updates: Partial<Profile>) {
    const profile = settings.profiles.find(_ => _.id === updates.id);
    if (profile) {
        Object.assign(profile, updates);
        saveSettings();
    }
}

export function createNewProfile(name: string) {
    const id = uuid.v4();
    const profile = newProfile(id, name);
    settings.profiles.push(profile);
    saveSettings();
    return profile;
}

export function deleteProfile(id: string) {
    const idx = settings.profiles.findIndex(_ => _.id === id);
    if (idx > -1) {
        settings.profiles.splice(idx, 1);
        saveSettings();
    }
}

function newProfile(id: string, name: string): Profile {
    return {
        id,
        name,
        width: 800,
        height: 600,
        x: 0,
        y: 0,
    };
}
