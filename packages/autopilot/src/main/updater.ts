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

import { autoUpdater } from 'electron-updater';
import { getSettings } from './settings';
import path from 'path';

export function autoCheckForUpdates() {
    configure();
    return autoUpdater.checkForUpdatesAndNotify();
}

export async function getUpdateInfo() {
    configure();
    const res = await (autoUpdater as any).getUpdateInfoAndProvider();
    return res.info;
}

function configure() {
    const settings = getSettings();
    autoUpdater.allowPrerelease = settings.channel === 'beta';
    if (process.env.NODE_ENV === 'development') {
        autoUpdater.updateConfigPath = path.join(__dirname, '../../dev-app-update.yml');
    }
}
