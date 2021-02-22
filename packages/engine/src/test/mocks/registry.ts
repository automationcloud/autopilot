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

import { RegistryService, ExtensionManifest, ExtensionVersion, Extension } from '../../main';
import { injectable } from 'inversify';
import semver from 'semver';
import { runtime } from '../runtime';
import { promises as fs } from 'fs';
import { Exception } from '@automationcloud/cdp';

@injectable()
export class RegistryServiceMock extends RegistryService {
    loadedExtensions: ExtensionVersion[] = [];
    mockExtensionLoading: boolean = false;

    availableManifests: ExtensionManifest[] = [
        {
            name: '@automationcloud/extension-test',
            latestVersion: '2.5.4',
            title: '',
            description: 'Commonly used actions and pipes',
            versions: ['2.5.4', '2.5.3', '2.5.2', '2.5.1', '2.5.0', '2.4.0', '2.3.0', '2.2.0', '2.1.0', '2.0.0'],
            tags: [],
            private: false,
        },
        {
            name: '@automationcloud/extension-captcha',
            title: '',
            description: 'Captcha solvers',
            latestVersion: '1.0.0',
            versions: ['1.0.0'],
            tags: [],
            private: false,
        }
    ];

    async listExtensions(): Promise<ExtensionManifest[]> {
        return this.availableManifests;
    }

    async loadExtension(name: string, versionRange: string) {
        if (this.mockExtensionLoading) {
            const { version } = await this.queryVersion(name, versionRange);
            this.loadedExtensions.push({ name, version });
            return new Extension(this.getExtensionDir(name, version), {
                name,
                version,
                title: '',
                description: '',
                category: 'extension',
                modules: [],
                tags: [],
                private: false,
            });
        }
        return await super.loadExtension(name, versionRange);
    }

    async queryVersion(name: string, versionRange: string): Promise<ExtensionVersion> {
        const manifest = this.availableManifests.find(m => m.name === name);
        if (!manifest) {
            throw new Exception({
                name: 'ExtensionNotFound',
                message: `Extension ${name} does not exist in registry`,
                retry: false,
            });
        }
        const version = semver.maxSatisfying(manifest.versions, versionRange);
        if (!version) {
            throw new Exception({
                name: 'ExtensionVersionNotFound',
                message: `No version of extension ${name} satisfies the requested version ${versionRange}`,
                retry: false,
                details: {
                    manifest,
                }
            });
        }
        return { name, version };
    }

    async loadExtensionBundle(name: string, version: string) {
        const file = runtime.getAssetFile(`extensions/${name}@${version}.tar`);
        return await fs.readFile(file);
    }

}
