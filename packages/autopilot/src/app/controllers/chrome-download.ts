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

import { injectable, inject } from 'inversify';
import { controller } from '../controller';
import { Exception } from '@automationcloud/engine';
import os from 'os';
import path from 'path';
import { promises as fs, createWriteStream } from 'fs';
import { promisify } from 'util';
import rimRaf from 'rimraf';
import http from 'http';
import https from 'https';
import extractZip from 'extract-zip';
import { ChromeManagerController } from './chrome-manager';

const rimRafAsync = promisify(rimRaf);

export const CHROME_REVISIONS = {
    darwin: '800250',
    win32: '800229',
    linux: '800220',
};
export const BASE_URL = 'https://storage.googleapis.com/chromium-browser-snapshots/';
export const ARCHIVE_PATHS = {
    darwin: `Mac/${CHROME_REVISIONS.darwin}/chrome-mac.zip`,
    win32: `Win_x64/${CHROME_REVISIONS.win32}/chrome-win.zip`,
    linux: `Linux_x64/${CHROME_REVISIONS.linux}/chrome-linux.zip`,
};
export const EXECUTABLE_PATH = {
    darwin: `chrome-mac/Chromium.app/Contents/MacOS/Chromium`,
    win32: `chrome-win/chrome.exe`,
    linux: `chrome-linux/chrome`,
};

export type DownloadStatus = 'idle' | 'downloading' | 'extracting';
export type ChromeSupportedPlatform = 'darwin' | 'win32' | 'linux';

@injectable()
@controller({ alias: 'chromeDownload', backgroundInit: true })
export class ChromeDownloadController {
    installed: boolean = false;
    platform: ChromeSupportedPlatform = os.platform() as ChromeSupportedPlatform;
    status: DownloadStatus = 'idle';
    progress: number = 0;

    constructor(
        @inject(ChromeManagerController)
        protected chromeManager: ChromeManagerController,
    ) {}

    async init() {
        await this.checkInstalled();
    }

    isInstalled() {
        return this.installed;
    }

    getRevision(): string {
        return CHROME_REVISIONS[this.platform];
    }

    getDownloadUrl(): string {
        return BASE_URL + ARCHIVE_PATHS[this.platform];
    }

    getChromeBaseDir() {
        // Making this configurable, if we ever need to
        return path.resolve(os.homedir(), '.autopilot/chrome');
    }

    getChromeInstallDir() {
        return path.resolve(this.getChromeBaseDir(), this.getRevision());
    }

    getExecutablePath() {
        return path.resolve(this.getChromeInstallDir(), EXECUTABLE_PATH[this.platform]);
    }

    async downloadAndInstall() {
        if (this.status !== 'idle') {
            return;
        }
        try {
            const zipFile = await this.downloadChromeArchive();
            await this.installFromZip(zipFile);
            await this.checkInstalled();
        } finally {
            this.status = 'idle';
        }
    }

    async updateChromeSettings() {
        await this.chromeManager.updateChromePath(this.getExecutablePath());
        await this.chromeManager.restartChrome();
    }

    protected async downloadChromeArchive(): Promise<string> {
        this.status = 'downloading';
        const zipFile = path.resolve(os.tmpdir(), 'autopilot', 'chrome.zip');
        await rimRafAsync(zipFile);
        await fs.mkdir(path.dirname(zipFile), { recursive: true });
        const url = this.getDownloadUrl();
        console.debug('Downloading Chromium', { url, zipFile });
        const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
            https.request(url, res => resolve(res))
                .on('error', err => reject(err))
                .end();
        });
        if (res.statusCode! >= 400) {
            throw new Exception({
                name: 'ChromeDownloadFailed',
                message: `Chrome download failed: server responded with ${res.statusCode} ${res.statusMessage}`,
            });
        }
        const length = Number(res.headers['content-length'] || 0);
        let written = 0;
        const dest = createWriteStream(zipFile);
        await new Promise((resolve, reject) => {
            res.on('data', chunk => {
                dest.write(chunk, () => {
                    written += chunk.length;
                    this.progress = Math.round((written / length) * 100);
                });
            });
            res.on('end', () => resolve());
            res.on('error', err => reject(err));
        });
        return zipFile;
    }

    protected async installFromZip(zipFile: string) {
        try {
            this.status = 'extracting';
            const installDir = this.getChromeInstallDir();
            await rimRafAsync(installDir);
            await fs.mkdir(installDir, { recursive: true });
            console.debug('Extracting Chromium', { installDir });
            await extractZip(zipFile, {
                dir: installDir,
            });
        } finally {
            await rimRafAsync(zipFile);
        }
    }

    protected async checkInstalled() {
        this.installed = await this.checkFileExists(this.getExecutablePath());
    }

    protected async checkFileExists(file: string) {
        try {
            const stat = await fs.stat(file);
            return stat.isFile();
        } catch (err) {
            if (err.code === 'ENOENT') {
                return false;
            }
            throw err;
        }
    }

    protected async checkExists(dirOrFile: string) {
        try {
            await fs.stat(dirOrFile);
            return true;
        } catch (err) {
            if (err.code === 'ENOENT') {
                return false;
            }
            throw err;
        }
    }

}
