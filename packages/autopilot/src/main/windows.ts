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

import { BrowserWindow, screen } from 'electron';
import { Profile, getLastProfile, updateProfile, getSettings } from './settings';
import path from 'path';
import os from 'os';
import { controlServer } from './globals';

export const windows: BrowserWindow[] = [];

export function sendToAllWindows(event: string, ...args: any[]) {
    windows.forEach(w => {
        if (w && w.webContents) {
            w.webContents.send(event, ...args);
        }
    });
}

export function createLastProfileWindow() {
    const profile = getLastProfile();
    createWindow(profile);
}

export function findWindowForProfile(profileId: string) {
    return windows.find(w => (w as any).profile.id === profileId) ?? null;
}

export function createWindow(profile: Profile) {
    const existing = findWindowForProfile(profile.id);
    if (existing) {
        activateWindow(existing);
    } else {
        const wnd = createNewWindow(profile);
        wnd.on('closed', () => {
            const idx = windows.indexOf(wnd);
            windows.splice(idx, 1);
            if (windows.length === 0) {
                process.exit(0);
            }
            sendToAllWindows('profileCountChanged', windows.length);
        });

        windows.push(wnd);
        sendToAllWindows('profileCountChanged', windows.length);
    }
}

export function activateWindow(wnd: BrowserWindow) {
    if (wnd.isMinimized()) {
        wnd.restore();
    }
    wnd.focus();
}

function createNewWindow(profile: Profile) {
    const partition = profile.id === 'default' ? 'persist:autopilot' : 'persist:autopilot-' + profile.id;
    let { x, y } = profile;
    const display = screen.getDisplayNearestPoint({ x, y });
    x = Math.min(Math.max(x, display.workArea.x), display.workArea.width);
    y = Math.min(Math.max(y, display.workArea.y), display.workArea.height);
    const wnd = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            partition,
            enableRemoteModule: true,
        },
        minWidth: 400,
        minHeight: 600,
        width: profile.width,
        height: profile.height,
        x,
        y,
        acceptFirstMouse: true,
        show: false,
        frame: false,
        title: `Autopilot (${profile.name})`,
        titleBarStyle: os.platform() === 'darwin' ? 'hiddenInset' : 'hidden',
    });
    const { instanceId } = getSettings();
    (wnd as any).instanceId = instanceId;
    (wnd as any).profile = profile;
    (wnd as any).appPath = path.resolve(__dirname, '../..');
    (wnd as any).controlServerPort = controlServer.getServerPort();
    wnd.loadURL('file://' + path.join(__dirname, '../../static/app.html'));
    wnd.on('ready-to-show', () => wnd.show());
    wnd.on('resize', saveBounds);
    wnd.on('move', saveBounds);
    wnd.on('focus', () => {
        wnd.webContents.send('focus');
        // settings.setLastProfile(profile.id);
    });
    // wnd.openDevTools();
    return wnd;

    function saveBounds() {
        const { width, height, x, y } = wnd.getBounds();
        Object.assign(profile, { width, height, x, y });
        updateProfile(profile);
    }
}
