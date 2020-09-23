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

import { runtime, assert, assertError } from '../globals';

import { RemoteElement } from '../../main/remote-element';
import { RemoteObject } from '../../main/remote-object';

describe('ExecutionContext', () => {
    describe('evaluate', () => {
        it('evaluates document as RemoteElement', async () => {
            await runtime.goto('/index.html');
            const ex = await runtime.page.mainFrame().getDefaultExecutionContext();
            const res = await ex.evaluate(() => document);
            assert(res instanceof RemoteElement);
        });

        it('evaluates async functions', async () => {
            const ex = await runtime.page.mainFrame().getDefaultExecutionContext();
            const res = await ex.evaluate(async () => {
                await new Promise(r => setTimeout(r, 100));
            });
            assert(res instanceof RemoteObject);
        });

        it('provides on-page exceptions', async () => {
            const ex = await runtime.page.mainFrame().getDefaultExecutionContext();
            const err = await assertError('EvaluateFailed', async () => {
                await ex.evaluate(() => {
                    throw new Error('Some error message');
                });
            });
            assert(err.message.includes('Some error message'));
        });
    });
});
