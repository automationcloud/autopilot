// Copyright 2020 Ubio Limited
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

import { spawnSync } from 'child_process';
import path from 'path';
import { promises as fs } from 'fs';
import { inject, injectable } from 'inversify';
import { Logger, Configuration, numberConfig, stringConfig, booleanConfig } from '@automationcloud/engine';
import { ChromeLaunchService } from './chrome';

const CACHE_ENABLED = booleanConfig('CACHE_ENABLED', false);
const CACHE_LOCK_TIMEOUT = numberConfig('CACHE_LOCK_TIMEOUT', 5 * 60000);
const CACHE_SHARE_DIR = stringConfig('CACHE_SHARE_DIR');

// TODO remove this (we're running with cache disabled for > year)
@injectable()
export class CacheService {
    @inject(Logger)
    logger!: Logger;
    @inject(Configuration)
    config!: Configuration;
    @inject(ChromeLaunchService)
    chrome!: ChromeLaunchService;

    async retrieveCache(cachePartition: string) {
        if (!this.isCacheEnabled()) {
            return;
        }
        try {
            const sourceDir = path.resolve(this.getCacheShareDir(), cachePartition);
            rm(this.chrome.getCacheDir());
            cp(sourceDir, this.chrome.getCacheDir());
        } catch (error) {
            this.logger.warn(`Could not retrieve chrome cache`, { error });
        }
    }

    async storeCache(cachePartition: string) {
        if (!this.isCacheEnabled()) {
            return;
        }
        try {
            // If Chrome Cache Directory doesn't exist, create new one
            // (this invalidates the cache)
            await fs.mkdir(this.chrome.getCacheDir(), { recursive: true });
            await fs.mkdir(this.getCacheShareDir(), { recursive: true });
            const targetDir = path.resolve(this.getCacheShareDir(), cachePartition);
            const tmpDir = path.resolve(this.getCacheShareDir(), cachePartition + '.tmp');
            const lockFile = path.resolve(this.getCacheShareDir(), cachePartition + '.lock');
            if (await this.acquireLock(lockFile)) {
                rm(tmpDir);
                cp(this.chrome.getCacheDir(), tmpDir);
                rm(targetDir);
                await fs.rename(tmpDir, targetDir);
                rm(lockFile);
            }
        } catch (error) {
            this.logger.warn(`Could not store chrome cache`, { error });
        }
    }

    getCacheShareDir() {
        return this.config.get(CACHE_SHARE_DIR);
    }

    isCacheEnabled() {
        return this.config.get(CACHE_ENABLED);
    }

    async acquireLock(file: string, timeout: number = this.config.get(CACHE_LOCK_TIMEOUT)): Promise<boolean> {
        try {
            await fs.mkdir(file);
            return true;
        } catch (err) {
            if (err.code !== 'EEXIST') {
                throw err;
            }
            try {
                const stat = await fs.stat(file);
                const stale = timeout && stat.mtime.getTime() < Date.now() - timeout;
                if (stale) {
                    // Remove and try again (with no stale check now)
                    rm(file);
                    return this.acquireLock(file, 0);
                }
                return false;
            } catch (err) {
                if (err.code === 'ENOENT') {
                    // Retry if it has been removed (with no stale check now)
                    return this.acquireLock(file, 0);
                }
                throw err;
            }
        }
    }
}

function cp(src: string, dst: string) {
    const { stderr, error } = spawnSync('cp', ['-r', src, dst], { encoding: 'utf8' });
    if (error) {
        throw Object.assign(new Error('Cache copy failed: ' + stderr), { cause: error });
    }
}

function rm(file: string) {
    const { stderr, error } = spawnSync('rm', ['-rf', file], { encoding: 'utf8' });
    if (error) {
        throw Object.assign(new Error('Cache remove failed: ' + stderr), { cause: error });
    }
}
