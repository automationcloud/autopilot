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

import { remote, ipcRenderer } from 'electron';
import path from 'path';
import os from 'os';
import uuid from 'uuid';
import { injectable } from 'inversify';
import { promises as fs } from 'fs';
import { UserData } from '../userdata';
import { controller } from '../controller';

const wnd = remote.getCurrentWindow();
const profile = (wnd as any).profile;
const profileId = profile ? profile.id : uuid.v4();

@injectable()
@controller()
export class StorageController {
    profileId: string;
    profileName: string;
    profileCount: number = 0;

    static getRootDir() {
        return path.resolve(os.homedir(), '.autopilot', 'profiles', profileId);
    }

    static getFile(relPath: string) {
        return path.join(this.getRootDir(), relPath);
    }

    constructor() {
        this.profileId = profileId;
        this.profileName = profile ? profile.name : 'Default';
        ipcRenderer.on('profileCountChanged', (_ev, count) => (this.profileCount = count));
        ipcRenderer.send('refreshProfileCount');
    }

    async init() {}

    createUserData(clusterId: string, debounceSave?: number): UserData {
        return new UserData(this, clusterId, debounceSave);
    }

    getFilename(relativePath: string) {
        return path.resolve(StorageController.getRootDir(), relativePath);
    }

    async saveData(clusterId: string, data: any) {
        const file = this.getFilename(`${clusterId}.json`);
        const dir = path.dirname(file);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(file, JSON.stringify(data), 'utf-8');
    }

    async loadData(clusterId: string, defaults: any = {}): Promise<any> {
        try {
            const file = this.getFilename(`${clusterId}.json`);
            const text = await fs.readFile(file, 'utf-8');
            return JSON.parse(text);
        } catch (e) {
            if (e.code === 'ENOENT') {
                return defaults;
            }
            throw e;
        }
    }
}
