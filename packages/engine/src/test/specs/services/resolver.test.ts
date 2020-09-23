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

import { runtime } from '../../runtime';
import assert from 'assert';
import { Extension } from '../../../main';

describe('ResolverService', () => {
    describe('dependencies', () => {
        context('dependency missing', () => {
            it('reports unmet dependencies', async () => {
                const script = runtime.createScript({
                    dependencies: [{ name: '@automationcloud/extension-test', version: '^2.0.0' }],
                });
                const unmet = [...runtime.$resolver.unmetDependencies(script.dependencies)];
                assert.deepEqual(unmet, [{ name: '@automationcloud/extension-test', version: '^2.0.0' }]);
            });
        });

        context('dependency exists and satisfies the range', () => {
            beforeEach(async () => {
                const ext = await Extension.load(runtime.getAssetFile('extensions/test'));
                ext.spec.version = '2.0.5';
                runtime.$resolver.addExtension(ext);
            });

            it('reports no unmet dependencies', async () => {
                const script = runtime.createScript({
                    dependencies: [{ name: '@automationcloud/extension-test', version: '^2.0.0' }],
                });
                const unmet = [...runtime.$resolver.unmetDependencies(script.dependencies)];
                assert.deepEqual(unmet, []);
            });
        });

        context('dependency exists, but above semver range', () => {
            beforeEach(async () => {
                const ext = await Extension.load(runtime.getAssetFile('extensions/test'));
                ext.spec.version = '3.0.0';
                runtime.$resolver.addExtension(ext);
            });

            it('reports the dependency as unmet', async () => {
                const script = runtime.createScript({
                    dependencies: [{ name: '@automationcloud/extension-test', version: '^2.0.0' }],
                });
                const unmet = [...runtime.$resolver.unmetDependencies(script.dependencies)];
                assert.deepEqual(unmet, [{ name: '@automationcloud/extension-test', version: '^2.0.0' }]);
            });
        });

        context('dependency exists, but below semver range', () => {
            beforeEach(async () => {
                const ext = await Extension.load(runtime.getAssetFile('extensions/test'));
                ext.spec.version = '1.0.5';
                runtime.$resolver.addExtension(ext);
            });

            it('reports the dependency as unmet', async () => {
                const script = runtime.createScript({
                    dependencies: [{ name: '@automationcloud/extension-test', version: '^2.0.0' }],
                });
                const unmet = [...runtime.$resolver.unmetDependencies(script.dependencies)];
                assert.deepEqual(unmet, [{ name: '@automationcloud/extension-test', version: '^2.0.0' }]);
            });
        });
    });
});
