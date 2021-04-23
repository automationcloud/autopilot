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

import { Configuration, Extension, ExtensionManifest, ExtensionSpec, ExtensionVersion, numberConfig, RegistryService } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';
import semver from 'semver';

import { controller } from '../controller';
import { EventsController } from '../controllers/events';
import { UserData } from '../userdata';
import { NotificationsController } from './notifications';
import { StorageController } from './storage';

const EXTENSIONS_AUTO_REFRESH_INTERVAL = numberConfig('EXTENSIONS_AUTO_REFRESH_INTERVAL', 5 * 60 * 1000);

/**
 * Manages installing extensions from registry and associated operations.
 */
@injectable()
@controller({ alias: 'extReg', priority: 1001 })
export class ExtensionRegistryController {
    userData: UserData;

    installedExtensions: Extension[] = [];
    failedExtensionSpecs: ExtensionSpec[] = [];
    allManifests: ExtensionManifest[] = [];
    searchQuery: string = '';
    filterCategory: 'extension' | 'connector' = 'extension';
    loading: boolean = false;
    error: Error | null = null;

    protected _extMap: Map<string, Extension> = new Map();
    protected _manifestMap: Map<string, ExtensionManifest> = new Map();

    constructor(
        @inject(StorageController)
        protected storage: StorageController,
        @inject(EventsController)
        protected events: EventsController,
        @inject(RegistryService)
        protected registry: RegistryService,
        @inject(Configuration)
        protected config: Configuration,
        @inject(NotificationsController)
        protected notifications: NotificationsController,
    ) {
        this.userData = storage.createUserData('extensions');
        this.events.on('apiAuthUpdated', () => this.init());
        this.events.on('extensionPublished', () => this.refresh());
        this.events.on('extensionsUpdated', () => {
            this._extMap = new Map(this.installedExtensions.map(_ => [_.spec.name, _]));
        });
        const interval = this.getAutoRefreshInterval();
        if (interval > 0) {
            // TODO consider making those checks cancellable
            // Note: we don't care if those overlap, because most async processes
            // use `this.loading` as a mutex
            setInterval(() => this.refresh(), interval);
        }
    }

    getAutoRefreshInterval() {
        return this.config.get(EXTENSIONS_AUTO_REFRESH_INTERVAL);
    }

    async init() {
        await this.initInstalledExtensions();
        this.refresh().catch(() => { });
    }

    update() {
        const installedExtensionSpecs = this.installedExtensions.map(ext => ext.spec);
        this.userData.update({
            installedExtensionSpecs,
        });
    }

    async refresh() {
        if (this.loading) {
            return;
        }
        this.loading = true;
        try {
            this.error = null;
            this.allManifests = await this.registry.listExtensions();
            this._manifestMap = new Map(this.allManifests.map(_ => [_.name, _]));
            await this.checkAndInstallAutoUpdates();
        } catch (err) {
            this.error = err;
        } finally {
            this.loading = false;
        }
    }

    get installedManifests() {
        return this.allManifests
            .filter(manifest => (manifest.category ?? 'extension') === this.filterCategory)
            .filter(manifest => this._extMap.has(manifest.name))
            .filter(manifest => this.matchesSearchQuery(manifest));
    }

    get availableManifests() {
        return this.allManifests
            .filter(manifest => (manifest.category ?? 'extension') === this.filterCategory)
            .filter(manifest => !this._extMap.has(manifest.name))
            .filter(manifest => this.matchesSearchQuery(manifest));
    }

    getInstalledVersion(manifest: ExtensionManifest): string | null {
        const ext = this._extMap.get(manifest.name);
        return ext ? ext.spec.version : null;
    }

    isInstalled(manifest: ExtensionManifest) {
        return this.getInstalledVersion(manifest) != null;
    }

    isOutdated(manifest: ExtensionManifest) {
        const installedVersion = this.getInstalledVersion(manifest);
        return installedVersion ? semver.gt(manifest.latestVersion, installedVersion) : false;
    }

    isVersionExist(name: string, version: string) {
        const manifest = this._manifestMap.get(name);
        if (!manifest) {
            return false;
        }
        return manifest.versions.includes(version);
    }

    matchesSearchQuery(manifest: ExtensionManifest) {
        const q = this.searchQuery.trim().toLowerCase();
        if (!q) {
            return true;
        }
        return [
            manifest.name,
            manifest.title || '',
            manifest.description || '',
            manifest.latestVersion || '',
        ].some(_ => _.toLowerCase().includes(q));
    }

    async initInstalledExtensions() {
        const data = await this.userData.loadData();
        const installedExtensionSpecs = (data.installedExtensionSpecs || []) as ExtensionSpec[];
        this.installedExtensions = [];
        const promises = installedExtensionSpecs.map(async spec => {
            try {
                const ext = await this.registry.loadExtension(spec.name, spec.version);
                this.installedExtensions.push(ext);
                console.info('Loaded extension', spec.name, spec.version);
            } catch (error) {
                if (error?.details?.status !== 401) {
                    console.warn(`Could not install extension ${spec.name}:${spec.version}`, error);
                    this.failedExtensionSpecs.push(spec);
                }
            }
        });
        await Promise.all(promises);
        this.pruneFailedExtensions();
        this.events.emit('extensionsUpdated');
    }

    async installExtension(name: string, version: string) {
        if (this.loading) {
            return;
        }
        try {
            this.loading = true;
            const ext = await this.registry.loadExtension(name, version);
            this._addExtension(ext);
            this.events.emit('extensionsUpdated');
            this.notifications.add({
                id: 'extension.install.success',
                level: 'info',
                title: `Extension ${ext.spec.name} ${ext.spec.version} installed`,
                canClose: true,
                timeout: 5000,
            });
        } catch (err) {
            this.notifications.add({
                id: 'extension.install.failed',
                level: 'fatal',
                title: `Could not install extension ${name}:${version}`,
                message: err.message,
                canClose: true,
                timeout: 5000,
            });
            console.warn(`Could not install extension ${name}`, err);
        } finally {
            this.loading = false;
        }
    }

    async installMultipleExtensions(list: ExtensionVersion[]) {
        if (this.loading) {
            return;
        }
        this.loading = true;
        let installed = 0;
        for (const { name, version } of list) {
            try {
                const ext = await this.registry.loadExtension(name, version);
                this._addExtension(ext);
                installed += 1;
            } catch (err) {
                this.notifications.add({
                    id: 'extension.install.failed',
                    level: 'fatal',
                    title: `Could not install extension ${name}:${version}`,
                    message: err.message,
                    canClose: true,
                    timeout: 5000,
                });
                console.warn(`Could not install extension ${name}`, err);
            }
        }
        this.events.emit('extensionsUpdated');
        if (installed > 0) {
            this.notifications.add({
                id: 'extension.install.success',
                level: 'info',
                title: `Installed ${installed} extension${installed > 1 ? 's' : ''}`,
                canClose: true,
                timeout: 5000,
            });
        }
        this.loading = false;
    }

    async uninstallExtension(name: string) {
        if (this.loading) {
            return;
        }
        try {
            this.loading = true;
            this.installedExtensions = this.installedExtensions.filter(e => e.spec.name !== name);
            this.update();
            this.events.emit('extensionsUpdated');
            this.notifications.add({
                id: 'extension.uninstall.success',
                level: 'info',
                title: `Extension ${name} uninstalled`,
                canClose: true,
                timeout: 5000,
            });
        } catch (err) {
            this.notifications.add({
                id: 'extension.uninstall.failed',
                level: 'fatal',
                title: `Could not uninstall extension ${name}`,
                message: err.message,
                canClose: true,
                timeout: 5000,
            });
            console.warn(`Could not uninstall extension ${name}`, err);
        } finally {
            this.loading = false;
        }
    }

    async updateExtension(name: string, version: string) {
        if (this.loading) {
            return;
        }
        try {
            this.loading = true;
            const ext = await this.registry.loadExtension(name, version);
            this._addExtension(ext);
            this.events.emit('extensionsUpdated');
            this.notifications.removeById('extension.*');
            this.notifications.add({
                id: 'extension.update.success',
                level: 'info',
                title: `Extension ${ext.spec.name} updated to ${ext.spec.version}`,
                canClose: true,
                timeout: 5000,
            });
        } catch (err) {
            this.notifications.add({
                id: 'extension.update.success',
                level: 'fatal',
                title: `Could not update extension ${name}`,
                message: err.message,
                canClose: true,
                timeout: 5000,
            });
            console.warn(`Extension update failed ${name}`, err);
        } finally {
            this.loading = false;
        }
    }

    async pruneFailedExtensions() {
        if (!this.failedExtensionSpecs.length) {
            return;
        }
        for (const spec of this.failedExtensionSpecs) {
            this.installedExtensions = this.installedExtensions.filter(e => e.spec.name !== spec.name);
        }
        this.update();
        this.events.emit('extensionsUpdated');
    }

    protected _addExtension(ext: Extension) {
        this.installedExtensions = this.installedExtensions.filter(e => e.spec.name !== ext.spec.name);
        this.installedExtensions.push(ext);
        this.update();
    }

    protected async checkAndInstallAutoUpdates() {
        const updates = this.collectAvailableAutoUpdates();
        if (updates.length === 0) {
            return;
        }
        console.info(`Auto-updating ${updates.length} extensions`, updates);
        const promises = updates.map(async updateInfo => {
            const { name, version } = updateInfo;
            try {
                const ext = await this.registry.loadExtension(name, version);
                this._addExtension(ext);
                console.debug(`Updated ${name}@${version}`);
            } catch (err) {
                console.warn(`Extension auto-update failed ${name}@${version}`, err);
            }
        });
        await Promise.all(promises);
    }

    protected collectAvailableAutoUpdates() {
        const updates: ExtensionVersion[] = [];
        for (const ext of this.installedExtensions) {
            const { name } = ext.spec;
            const manifest = this._manifestMap.get(name);
            if (!manifest) {
                continue;
            }
            const versionRange = `^${ext.spec.version}`;
            const maxSatisfying = semver.maxSatisfying(manifest.versions, versionRange);
            if (maxSatisfying && maxSatisfying !== ext.spec.version) {
                updates.push({ name, version: maxSatisfying });
            }
        }
        return updates;
    }

}
