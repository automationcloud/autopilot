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

import { runtime } from '../../runtime';

describe('Flow.elseIf', () => {
    it('throws when not preceeded by if or else-if', async () => {
        const script = createScriptFromPseudoDef([['Flow.elseIf', true, 'child']]);
        await runtime.assertError('InvalidScript', () => script.runAll());
    });

    it('does not enter when previous sibling is satisfied', async () => {
        const script = createScriptFromPseudoDef([
            ['Flow.if', true, 'childA'],
            ['Flow.elseIf', true, 'childB'],
        ]);
        await script.runAll();
        const childA = script.getActionById('childA')!;
        const childB = script.getActionById('childB')!;
        assert(childA.$runtime.finishedAt != null);
        assert(childB.$runtime.finishedAt == null);
    });

    it('does not enter when previous sibling is not satisfied and condition not satisfied', async () => {
        const script = createScriptFromPseudoDef([
            ['Flow.if', false, 'childA'],
            ['Flow.elseIf', false, 'childB'],
        ]);
        await script.runAll();
        const childA = script.getActionById('childA')!;
        const childB = script.getActionById('childB')!;
        assert(childA.$runtime.finishedAt == null);
        assert(childB.$runtime.finishedAt == null);
    });

    it('enters when previous sibling is not satisfied and condition is satisfied', async () => {
        const script = createScriptFromPseudoDef([
            ['Flow.if', false, 'childA'],
            ['Flow.elseIf', true, 'childB'],
        ]);
        await script.runAll();
        const childA = script.getActionById('childA')!;
        const childB = script.getActionById('childB')!;
        assert(childA.$runtime.finishedAt == null);
        assert(childB.$runtime.finishedAt != null);
    });

    it('integration: only one branch is entered', async () => {
        const script = createScriptFromPseudoDef([
            ['Flow.if', false, 'childA'],
            ['Flow.elseIf', false, 'childB'],
            ['Flow.elseIf', true, 'childC'],
            ['Flow.elseIf', false, 'childD'],
            ['Flow.elseIf', true, 'childE'],
        ]);
        await script.runAll();
        assert(script.getActionById('childA')!.$runtime.finishedAt == null);
        assert(script.getActionById('childB')!.$runtime.finishedAt == null);
        assert(script.getActionById('childC')!.$runtime.finishedAt != null);
        assert(script.getActionById('childD')!.$runtime.finishedAt == null);
        assert(script.getActionById('childE')!.$runtime.finishedAt == null);
    });

    it('integration: multiple adjacent chains handled independently', async () => {
        const script = createScriptFromPseudoDef([
            ['Flow.if', true, 'childA'],
            ['Flow.elseIf', false, 'childB'],
            ['Flow.if', false, 'childC'],
            ['Flow.elseIf', true, 'childD'],
        ]);
        await script.runAll();
        assert(script.getActionById('childA')!.$runtime.finishedAt != null);
        assert(script.getActionById('childB')!.$runtime.finishedAt == null);
        assert(script.getActionById('childC')!.$runtime.finishedAt == null);
        assert(script.getActionById('childD')!.$runtime.finishedAt != null);
    });

    function createScriptFromPseudoDef(pseudo: Array<[string, boolean, string]>) {
        return runtime.createScriptWithActions(
            pseudo.map(p => {
                return {
                    type: p[0],
                    pipeline: {
                        pipes: [{ type: 'Value.getJson', value: p[1].toString() }],
                    },
                    children: [{ id: p[2], type: 'Flow.group' }],
                };
            }),
        );
    }
});
