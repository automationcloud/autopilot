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

import { app } from 'electron';

import { controlServer } from './globals';
import { initIpcListeners } from './ipc';
import { autoCheckForUpdates } from './updater';
import { activateWindow, createLastProfileWindow, windows } from './windows';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
process.env.NODE_OPTIONS = '--insecure-http-parser';
process.env.NODE_OPTIONS = '--max-http-header-size=65535';

app.setAsDefaultProtocolClient('ubio');

const primary = app.requestSingleInstanceLock();
if (!primary) {
    app.quit();
}

app.on('ready', async () => {
    try {
        initIpcListeners();
        autoCheckForUpdates();
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

process.on('uncaughtException', err => {
    console.error(err);
    process.exit(1);
});
