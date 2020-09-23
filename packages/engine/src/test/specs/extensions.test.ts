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

import assert from 'assert';
import { promises as fs } from 'fs';
import path from 'path';
import { Extension, Action, InspectionLevel, ActionInspection } from '../../main';
import { runtime } from '../runtime';
import tar from 'tar';
import glob from 'glob';
import os from 'os';
import rimraf from 'rimraf';

describe('Extension', () => {

    const tmpDir = path.join(os.tmpdir(), 'engine/test/extensions');

    beforeEach(async () => {
        rimraf.sync(tmpDir);
        await fs.mkdir(tmpDir, { recursive: true });
    });

    it('creates an extension tarball', async () => {
        const extensionDir = runtime.getAssetFile('extensions/test');
        const tarballFile = path.join(tmpDir, 'test.tar');
        await Extension.packExtensionBundle(extensionDir, tarballFile);

        // Now let's extract it and see what's inside
        const dir = path.join(tmpDir, 'extracted');
        await fs.mkdir(dir, { recursive: true });
        await tar.x({
            file: tarballFile,
            cwd: dir,
        });
        const files = glob.sync('**', { cwd: dir }).sort();
        assert.deepEqual(files, [
            'included',
            'included/foo.js',
            'package.json'
        ]);
    });

    it('allows exposing an arbitrary action', async () => {
        let result = 1;
        class MyCustomAction extends Action {
            static $type = 'Custom.someAction';
            async exec() {
                result += 1;
            }
        }
        const extension = new Extension('some-dir', {
            name: 'some-extension',
            title: '',
            description: '',
            version: '1.0.0',
            modules: [],
        });
        (extension as any).loadModulesSync = () => {
            extension.actionClasses = [MyCustomAction];
        };
        runtime.$resolver.addExtension(extension);
        await runtime.runActions([
            { type: 'Custom.someAction' }
        ]);
        assert.equal(result, 2);
    });

    it('allow registering inspections', async () => {
        class MyInspection extends ActionInspection {
            inspect(_node: Action) {
                return [
                    {
                        name: 'my-custom-inspection',
                        level: InspectionLevel.Warn,
                        message: 'Something is wrong'
                    }
                ];
            }
        }
        const extension = new Extension('some-dir', {
            name: 'some-extension',
            title: '',
            description: '',
            version: '1.0.0',
            modules: [],
        });
        (extension as any).loadModulesSync = () => {
            extension.inspectionClasses = [MyInspection];
        };
        runtime.$resolver.addExtension(extension);
        const script = await runtime.createScriptWithActions([
            { id: 'tst', type: 'blah '}
        ]);
        const action = script.getActionById('tst');
        const reports = [...script.inspect()];
        const report = reports.find(r => r.name === 'my-custom-inspection')!;
        assert.ok(report);
        assert.equal(report.level, InspectionLevel.Warn);
        assert.equal(report.message, 'Something is wrong');
        assert.equal(report.action, action);
        assert.equal(report.context, action?.$context);
    });

});
