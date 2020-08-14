import { UserData } from '../userdata';
import { Extension, booleanConfig, ApiRequest } from '@automationcloud/engine';
import chokidar from 'chokidar';
import { injectable, inject } from 'inversify';
import { StorageController } from './storage';
import { remote } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import { EventBus } from '../event-bus';
import { controller } from '../controller';
import { SettingsController } from './settings';
import { rimrafAsync } from '../util/helpers';
import { getAppPath } from '../globals';
import { debounce } from 'debounce';
import os from 'os';

const UI_EXTENSIONS_DEV = booleanConfig('UI_EXTENSIONS_DEV', false);

@injectable()
@controller({ priority: 1001 })
export class ExtensionDevController {
    userData: UserData;
    extensions: Extension[] = [];
    processing: Extension | null = null;

    fsWatcher: chokidar.FSWatcher;

    constructor(
        @inject(StorageController)
        protected storage: StorageController,
        @inject(SettingsController)
        protected settings: SettingsController,
        @inject(EventBus)
        protected events: EventBus,
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
        const { localDirs = [] } = await this.userData.loadData();
        this.extensions = [];
        for (const dir of localDirs) {
            await this.initExtension(dir);
        }
    }

    update() {
        this.userData.update({
            localDirs: this.extensions.map(_ => _.dir),
        });
    }

    isDevEnabled() {
        return this.settings.get(UI_EXTENSIONS_DEV);
    }

    protected async initExtension(dir: string) {
        const ext = await Extension.load(dir);
        await this.symlinkDependencies(dir);
        this.extensions.push(ext);
        this.fsWatcher.add(dir);
        console.info(`🧐 Watching for file changes at ${dir}`);
        return ext;
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

    async removeExtension(ext: Extension) {
        this.fsWatcher.unwatch(ext.dir);
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
