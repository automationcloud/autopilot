import { Extension, ExtensionVersion, ExtensionManifest } from '../extension';
import { stringConfig, Configuration, Logger } from '@automationcloud/cdp';
import path from 'path';
import { inject, injectable } from 'inversify';
import { promises as fs } from 'fs';
import tar from 'tar';
import { ApiRequest } from './api-request';
import rimraf from 'rimraf';
import { promisify } from 'util';

const rimrafAsync = promisify(rimraf);

const EXTENSIONS_DIR = stringConfig('EXTENSIONS_DIR', path.join(process.cwd(), '.tmp/extensions'));

@injectable()
export class RegistryService {
    constructor(
        @inject(Configuration)
        protected config: Configuration,
        @inject(ApiRequest)
        protected api: ApiRequest,
        @inject(Logger)
        protected logger: Logger,
    ) {
    }

    async listExtensions(): Promise<ExtensionManifest[]> {
        const res = await this.api.get('/ExtensionRegistry/list');
        return res.data;
    }

    async queryVersion(name: string, versionRange: string): Promise<ExtensionVersion> {
        const res = await this.api.get('/ExtensionRegistry/queryVersion', {
            query: {
                name,
                versionRange,
            }
        });
        return res;
    }

    async loadExtension(name: string, versionRange: string): Promise<Extension> {
        return await this._loadExtensionWithRetry(name, versionRange, 1);
    }

    protected async _loadExtensionWithRetry(
        name: string,
        versionRange: string,
        attempts: number,
    ): Promise<Extension> {
        const { version } = await this.queryVersion(name, versionRange);
        const dir = this.getExtensionDir(name, version);
        const dirExists = await fs.stat(dir).then(s => s.isDirectory()).catch(() => false);
        try {
            if (!dirExists) {
                await fs.mkdir(dir, { recursive: true });
                const buffer = await this.loadExtensionBundle(name, version);
                const tarballFile = path.join(this.getExtensionsRoot(), `${name}@${version}.tar`);
                await fs.mkdir(path.dirname(tarballFile), { recursive: true });
                await fs.writeFile(tarballFile, buffer);
                await tar.x({
                    file: tarballFile,
                    cwd: dir,
                });
            }
            return await Extension.load(dir);
        } catch (error) {
            if (attempts > 0) {
                this.logger.warn(`Failed to load extension ${name}, will keep trying`, {
                    error,
                    dir,
                    dirExists,
                });
                await rimrafAsync(dir).catch(() => {});
                return await this._loadExtensionWithRetry(name, versionRange, attempts - 1);
            }
            throw error;
        }
    }

    async loadExtensionBundle(name: string, version: string): Promise<Buffer> {
        const res = await this.api.get('/ExtensionRegistry/loadBundle', {
            query: {
                name,
                version,
            }
        });
        return Buffer.from(res.tarballBase64, 'base64');
    }

    getExtensionsRoot() {
        return this.config.get(EXTENSIONS_DIR);
    }

    getExtensionDir(name: string, version: string) {
        return path.join(this.getExtensionsRoot(), name, version);
    }

}
