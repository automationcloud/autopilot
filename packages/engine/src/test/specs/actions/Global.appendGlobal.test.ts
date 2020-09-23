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

describe('Global.appendGlobal', () => {
    it('appends items to non-existent list', async () => {
        const script = await runtime.createScriptWithActions([
            {
                type: 'Global.appendGlobal',
                key: 'list',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify(['foo', 'bar', 'baz']),
                        },
                        { type: 'List.fromArray' },
                    ],
                },
            },
        ]);
        await script.runAll();
        assert.equal(runtime.$globals.values.length, 1);
        assert.equal(runtime.$globals.values[0].key, 'list');
        assert.deepEqual(runtime.$globals.values[0].value, ['foo', 'bar', 'baz']);
    });

    it('appends items to existing list', async () => {
        const script = await runtime.createScriptWithActions([
            {
                type: 'Global.appendGlobal',
                key: 'list',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify(['foo', 'bar', 'baz']),
                        },
                        { type: 'List.fromArray' },
                    ],
                },
            },
        ]);
        runtime.$globals.values = [{ key: 'list', value: ['hi', 'hey'] }];
        await script.runAll();
        assert.equal(runtime.$globals.values.length, 1);
        assert.equal(runtime.$globals.values[0].key, 'list');
        assert.deepEqual(runtime.$globals.values[0].value, ['hi', 'hey', 'foo', 'bar', 'baz']);
    });

    it('throws if global contains non-array', async () => {
        const script = await runtime.createScriptWithActions([
            {
                type: 'Global.appendGlobal',
                key: 'list',
                pipeline: {
                    pipes: [
                        {
                            type: 'Value.getJson',
                            value: JSON.stringify(['foo', 'bar', 'baz']),
                        },
                        { type: 'List.fromArray' },
                    ],
                },
            },
        ]);
        runtime.$globals.values = [{ key: 'list', value: { foo: 'bar' } }];
        await runtime.assertError('PlaybackError', async () => {
            await script.runAll();
        });
    });
});
