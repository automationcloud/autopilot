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

import { ApiRequest, Extension, ExtensionSpec } from '@automationcloud/engine';
import chokidar from 'chokidar';
import { debounce } from 'debounce';
import { remote } from 'electron';
import { promises as fs } from 'fs';
import { inject, injectable } from 'inversify';
import os from 'os';
import path from 'path';

import { controller } from '../controller';
import { EventsController } from '../controllers/events';
import { getAppPath } from '../globals';
import { UserData } from '../userdata';
import { rimrafAsync } from '../util/helpers';
import { SettingsController } from './settings';
import { StorageController } from './storage';

@injectable()
@controller({ alias: 'extDev', priority: 1001 })
export class ExtensionDevController {
    userData: UserData;
    extensions: Extension[] = [];
    processing: Extension | null = null;

    watchIgnoreList: string[] = [];

    fsWatcher: chokidar.FSWatcher;

    constructor(
        @inject(StorageController)
        protected storage: StorageController,
        @inject(SettingsController)
        protected settings: SettingsController,
        @inject(EventsController)
        protected events: EventsController,
        @inject(ApiRequest)
        protected api: ApiRequest,
    ) {
        this.userData = storage.createUserData('extension-dev');
        const onFsEvent = debounce(this.onFsEvent.bind(this), 500);
        // Start with no files to watch
        this.fsWatcher = chokidar.watch([]).on('ready', () => {
            this.fsWatcher.on('all', onFsEvent);
        });
    }

    async init() {
        const {
            localDirs = [],
            watchIgnoreList = [],
        } = await this.userData.loadData();
        this.extensions = [];
        this.watchIgnoreList = watchIgnoreList;
        for (const dir of localDirs) {
            await this.initExtension(dir);
        }
    }

    update() {
        this.userData.update({
            localDirs: this.extensions.map(_ => _.dir),
            watchIgnoreList: this.watchIgnoreList,
        });
    }

    protected async initExtension(dir: string) {
        const ext = await Extension.load(dir);
        await this.symlinkDependencies(dir);
        this.extensions.push(ext);
        if (!this.watchIgnoreList.includes(dir)) {
            this.watch(ext, false);
        }
        return ext;
    }

    availableExtensions(category: string, searchQuery: string) {
        return this.extensions
            .map(e => e.spec)
            .filter(spec => (spec.category ?? 'extension') === category)
            .filter(spec => this.matchesSearchQuery(spec, searchQuery));
    }

    matchesSearchQuery(spec: ExtensionSpec, searchQuery: string) {
        const q = searchQuery.trim().toLowerCase();
        if (!q) {
            return true;
        }
        return [
            spec.name,
            spec.title || '',
            spec.description || '',
            ...spec.tags
        ].some(_ => _.toLowerCase().includes(q));
    }

    async showAddExtensionPopup() {
        const { filePaths = [] } = await remote.dialog.showOpenDialog({
            filters: [{ name: 'Directory', extensions: ['*'] }],
            properties: ['openDirectory'],
        });
        if (!filePaths.length) {
            // Cancelled
            return;
        }
        try {
            const [dir] = filePaths;
            await fs.stat(path.join(dir, 'package.json')).catch(_err => {
                throw new Error('Please select a directory with package.json');
            });
            await this.addExtension(dir);
        } catch (err) {
            alert(`Unable to add local extension: ${err.message}`);
            console.error(err);
        }
    }

    async addExtension(dir: string) {
        if (this.isLocalExtensionExists(dir)) {
            return;
        }
        await this.initExtension(dir);
        this.update();
        this.events.emit('extensionsUpdated');
    }

    isLocalExtensionExists(dir: string) {
        return this.extensions.some(r => r.dir === dir);
    }

    isWatching(ext: Extension) {
        return !this.watchIgnoreList.includes(ext.dir);
    }

    watch(ext: Extension, remember: boolean = false) {
        this.fsWatcher.add(ext.dir);
        console.info(`🧐 Watching for FS changes at ${ext.dir}`);
        if (remember) {
            this.watchIgnoreList = this.watchIgnoreList.filter(_ => _ !== ext.dir);
            this.update();
        }
    }

    unwatch(ext: Extension, remember: boolean = false) {
        this.fsWatcher.unwatch(ext.dir);
        console.info(`🧐 Stopped watching ${ext.dir}`);
        if (remember) {
            if (!this.watchIgnoreList.includes(ext.dir)) {
                this.watchIgnoreList.push(ext.dir);
            }
            this.update();
        }
    }

    async removeExtension(name: string) {
        const ext = this.extensions.find(_ => _.spec.name !== name);
        if (!ext) {
            return;
        }
        this.unwatch(ext, false);
        this.extensions = this.extensions.filter(_ => _.dir !== ext.dir);
        this.update();
        this.events.emit('extensionsUpdated');
    }

    async publishExtension(ext: Extension) {
        if (this.processing) {
            return;
        }
        this.processing = ext;
        try {
            const tmpDir = path.join(os.tmpdir(), 'extensions');
            await fs.mkdir(tmpDir, { recursive: true });
            const tarballFile = path.join(tmpDir, `${ext.spec.name}.tar`);
            await Extension.packExtensionBundle(ext.dir, tarballFile);
            const buffer = await fs.readFile(tarballFile);
            await this.api.post('/ExtensionRegistry/publish', {
                body: {
                    name: ext.spec.name,
                    version: ext.spec.version,
                    description: ext.spec.description,
                    private: ext.spec.private,
                    tags: ext.spec.tags,
                    tarballBase64: buffer.toString('base64'),
                }
            });
            this.events.emit('extensionPublished');
        } catch (err) {
            alert(err.message);
            console.error(err);
        } finally {
            this.processing = null;
        }
    }

    protected async onFsEvent(eventName: string, fullPath: string) {
        const ext = this.extensions.find(_ => fullPath.startsWith(_.dir));
        if (!ext) {
            return;
        }
        try {
            const relPath = path.relative(ext.dir, fullPath);
            console.debug(`📝 Changed local file`, relPath);
            if (relPath === 'package.json') {
                ext.spec = await Extension.loadExtensionSpec(ext.dir);
            } else {
                this.events.emit('extensionsUpdated');
            }
        } catch (err) {
            console.warn('Local extension update failed', err);
        }
    }

    async symlinkDependencies(dir: string) {
        // Engine from extension directory must be symlinked to Autopilot's embedded version
        const packageNames = [`@automationcloud/engine`];
        const localNodeModules = path.join(getAppPath(), 'node_modules');
        const extNodeModules = path.join(dir, 'node_modules');
        for (const pkgName of packageNames) {
            try {
                const localPath = path.join(localNodeModules, pkgName);
                const extPath = path.join(extNodeModules, pkgName);
                // Make sure local path is a directory
                const localStat = await fs.stat(localPath);
                if (!localStat.isDirectory()) {
                    throw new Error(`Cannot initialize local extension: expected ${localPath} to be a directory`);
                }
                // Check if it's already a symlink
                const extStat = await fs.lstat(extPath);
                if (extStat.isSymbolicLink()) {
                    const resolvedExt = await fs.realpath(extPath);
                    const resolvedLocal = await fs.realpath(localPath);
                    if (resolvedExt === resolvedLocal) {
                        continue;
                    }
                }
                // If not, remove the original one and link it
                await rimrafAsync(extPath);
                await fs.symlink(localPath, extPath, 'dir');
                console.debug(`Symlinked ${localPath} to ${extPath}`);
            } catch (err) {
                // TODO should we bail altogether maybe?
                console.error(`Failed to symlink module ${pkgName} for ${dir}`, err);
            }
        }

    }

}
