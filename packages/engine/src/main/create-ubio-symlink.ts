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

/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

/**
 * This is a hack for transitioning from @ubio/engine to @automationcloud/engine.
 * This allows extensions to work with both @ubio/engine and @automationcloud/engine.
 *
 * It should be removed once we fully migrate.
 */
export function createUbioSymlink(packageRoot: string) {
    const nodeModulesDir = path.resolve(packageRoot, 'node_modules');
    const symlink = path.join(nodeModulesDir, '@ubio', 'engine');
    const target = path.join(nodeModulesDir, '@automationcloud', 'engine');
    const parentDir = path.dirname(symlink);
    try {
        fs.mkdirSync(parentDir, { recursive: true });
        fs.symlinkSync(path.relative(parentDir, target), symlink, 'junction');
    } catch (err) {
        if (err.code !== 'EEXIST') {
            console.warn(err);
        }
    }
}
