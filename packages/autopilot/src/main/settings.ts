import uuid from 'uuid';
import os from 'os';
import fs from 'fs';
import path from 'path';
import debounce from 'debounce';

const settings = loadSettings();
const settingsFile = path.resolve(os.homedir(), '.autopilot', 'settings.json');
const saveSettings = debounce(_saveSettings, 300);

export interface Settings {
    lastProfileId: string;
    profiles: Profile[];
}

export interface Profile {
    id: string;
    name: string;
    width: number;
    height: number;
    x: number;
    y: number;
}

function loadSettings(): Settings {
    try {
        const text = fs.readFileSync(settingsFile, 'utf-8');
        return JSON.parse(text);
    } catch (err) {
        return createDefaultSettings();
    }
}

function _saveSettings() {
    const dir = path.dirname(settingsFile);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
}

function createDefaultSettings(): Settings {
    return {
        lastProfileId: 'default',
        profiles: [newProfile('default', 'Default')],
    };
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
