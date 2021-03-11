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

describe('Global.setGlobal', () => {
    it('sets global variable', async () => {
        await runtime.goto('/input.html');
        const script = await runtime.createScriptWithActions([
            {
                id: 'set-global',
                type: 'Global.setGlobal',
                key: 'hi',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify({ hello: 'hello world' }),
                        },
                    ],
                },
            },
            {
                id: 'input',
                type: 'Page.input',
                pipeline: {
                    pipes: [
                        {
                            type: 'DOM.queryOne',
                            selector: 'input',
                        },
                        {
                            type: 'Value.getGlobal',
                            key: 'hi',
                        },
                        {
                            type: 'Object.getPath',
                            path: '/hello',
                        },
                    ],
                },
            },
        ]);
        await script.runAll();
        assert.equal(runtime.$globals.values.length, 1);
        assert.equal(runtime.$globals.values[0].key, 'hi');
        assert.deepEqual(runtime.$globals.values[0].value, { hello: 'hello world' });
        const input = await runtime.page.querySelector('input');
        const { value } = await input!.getInfo();
        assert.equal(value, 'hello world');
    });
});
