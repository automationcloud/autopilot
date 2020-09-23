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

import { app, ipcMain } from 'electron';
import { getProfile, getAllProfiles, createNewProfile } from './settings';
import { windows, createWindow, createLastProfileWindow, activateWindow } from './windows';
import { controlServer } from './globals';
import { checkForUpdates } from './updater';
import { createUbioSymlink } from '@automationcloud/engine';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
process.env.NODE_OPTIONS = '--http-parser=legacy';

createUbioSymlink(`${__dirname}/../..`);

app.setAsDefaultProtocolClient('ubio');

const primary = app.requestSingleInstanceLock();
if (!primary) {
    app.quit();
}

app.on('ready', async () => {
    try {
        checkForUpdates();
        app.name = 'UBIO Autopilot';
        await controlServer.start();
        createLastProfileWindow();
    } catch (error) {
        console.error(error);
        app.quit();
    }
});

app.on('second-instance', () => {
    const wnd = windows[0];
    if (wnd) {
        activateWindow(wnd);
    }
});

// Electron doesn't quit on throwing exceptions, so let's help him
process.on('uncaughtException', err => {
    console.error(err);
    process.exit(1);
});

ipcMain.on('profile.activate', (ev, id) => {
    const profile = getProfile(id);
    if (profile) {
        createWindow(profile);
    }
});

ipcMain.on('profile.create', () => {
    const profiles = getAllProfiles();
    const numbers = profiles.reduce((nums, p) => {
        const m = /^Profile (\d+)$/gi.exec(p.name);
        const num = m ? parseInt(m[1]) : 0;
        return nums.concat([num]);
    }, [] as number[]);
    const max = numbers.sort((a, b) => (a > b ? 1 : -1)).reverse()[0] || 0;
    const name = `Profile ${max + 1}`;
    const profile = createNewProfile(name);
    createWindow(profile);
});

ipcMain.on('refreshProfileCount', event => {
    event.reply('profileCountChanged', windows.length);
});
