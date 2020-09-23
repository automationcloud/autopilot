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

import { runtime } from '../runtime';
import assert from 'assert';
import { actionRenameMap, pipeRenameMap } from '../../main/migrations';

describe('Migrations', () => {

    context('the big renaming', () => {

        it.skip('covers all existing pipes/actions', () => {
            const missing = getMissingRenames();
            assert.equal(missing.length, 0, `Missing renames:\n` + missing.join('\n'));
        });

    });

});

function getMissingRenames() {
    const resolver = runtime.$resolver;
    const actionIndex = resolver.getActionIndex();
    const pipeIndex = resolver.getPipeIndex();
    const missing: string[] = [];
    for (const [from, to] of Object.entries(actionRenameMap)) {
        if (actionIndex.get(to) == null) {
            missing.push('action:' + from);
        }
    }
    for (const [from, to] of Object.entries(pipeRenameMap)) {
        if (pipeIndex.get(to) == null) {
            missing.push('pipe:' + from);
        }
    }
    return missing;
}
