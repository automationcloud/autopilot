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

import fs from 'fs';
import path from 'path';

import { Extension } from './extension';

const pkgFile = path.join(__dirname, '../../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));

/**
 * Core extension providing actions and pipes packed into the engine codebase.
 */
export const coreExtension = new Extension(__dirname, {
    name: '<core>',
    title: '',
    description: 'UBIO Automation Core',
    category: 'extension',
    version: pkg.version,
    modules: [
        './matcher.js',
        './definition.js',
        './actions/**/*.js',
        './pipes/**/*.js',
        './inspections/**/*.js',
    ],
    tags: [],
    private: false,
});
