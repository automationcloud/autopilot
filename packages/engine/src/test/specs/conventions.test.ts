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
import glob from 'glob';
import path from 'path';
import { promisify } from 'util';

const globAsync = promisify(glob);

describe('Conventions', () => {

    context('actions', () => {
        it('filename matches type', async () => {
            const dir = path.join(process.cwd(), 'src/main/actions');
            const files = await globAsync('**/*.ts', { cwd: dir });
            const mismatches: string[] = [];
            for (const relPath of files) {
                const file = path.join(dir, relPath);
                const code = await fs.readFile(file, 'utf-8');
                const type = extractType(code);
                if (!type) {
                    continue;
                }
                if (`${type}.ts` !== relPath) {
                    mismatches.push(relPath);
                }
            }
            assert.equal(mismatches.length, 0,
                'Mismatching action filenames:\n' + mismatches.join('\n'));
        });
    });

    context('pipes', () => {
        it('filename matches type', async () => {
            const dir = path.join(process.cwd(), 'src/main/pipes');
            const files = await globAsync('**/*.ts', { cwd: dir });
            const mismatches: string[] = [];
            for (const relPath of files) {
                const file = path.join(dir, relPath);
                const code = await fs.readFile(file, 'utf-8');
                const type = extractType(code);
                if (!type) {
                    continue;
                }
                if (`${type}.ts` !== relPath) {
                    mismatches.push(relPath);
                }
            }
            assert.equal(mismatches.length, 0,
                'Mismatching pipe filenames:\n' + mismatches.join('\n'));
        });
    });

});

function extractType(code: string) {
    const m = /static\s+\$type\s+=\s+'(.*?)';/.exec(code);
    return m ? m[1] : null;
}
