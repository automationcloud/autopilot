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

import { assert, runtime } from '../globals';

describe('RemoteObject', () => {
    describe('jsonValue', () => {
        it('resolves JSON value', async () => {
            await runtime.goto('/index.html');
            const obj = await runtime.page.evaluate(() => {
                return { foo: 1, bar: 2 };
            });
            const json = await obj.jsonValue();
            assert.deepEqual(json, { foo: 1, bar: 2 });
        });
    });

    describe('getOwnProperties', () => {
        it('returns own properties', async () => {
            await runtime.goto('/index.html');
            const obj = await runtime.page.evaluate(() => {
                return { foo: 1, bar: 2 };
            });
            const props = await obj.getOwnProperties();
            assert.equal(props.size, 2);
            assert.ok(props.get('foo'));
            assert.ok(props.get('bar'));
        });
    });
});
