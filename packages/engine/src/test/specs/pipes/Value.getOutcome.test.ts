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

describe('Value.getOutcome', () => {

    context('action exists', () => {

        context('action was run', () => {
            it('returns an outcome', async () => {
                const { outputAction, resultAction } = createTestRig();
                await outputAction.run();
                const res = await resultAction.selectOne((resultAction as any).pipeline);
                assert.equal(res.value, 'I am the outcome');
            });
        });

        context('action was not run', () => {
            it('throws an error if non optional', async () => {
                const { resultAction } = createTestRig();
                try {
                    await resultAction.selectOne((resultAction as any).pipeline);
                    throw new Error('Unexpected success');
                } catch (err) {
                    assert.equal(err.name, 'OutcomeNotAvailable');
                }
            });

            it('resolves null if optional', async () => {
                const { resultAction } = createTestRig({ optional: true });
                const res = await resultAction.selectOne((resultAction as any).pipeline);
                assert.equal(res.value, null);
            });
        });

    });

    context('action does not exist', () => {

        it('throws an error', async () => {
            const { resultAction } = createTestRig({
                ref: {
                    actionId: 'unknown',
                    paramName: '$foo'
                }
            });
            try {
                await resultAction.selectOne((resultAction as any).pipeline);
                throw new Error('Unexpected success');
            } catch (err) {
                assert.equal(err.name, 'InvalidScript');
            }
        });

    });

});

function createTestRig(overrides: any = {}) {
    const script = runtime.createScriptWithActions([
        {
            id: 'output',
            type: 'Flow.output',
            outputKey: 'foo',
            pipeline: [
                {
                    type: 'Value.getJson',
                    value: JSON.stringify('I am the outcome'),
                },
            ]
        },
        {
            id: 'result',
            type: 'placeholder',
            pipeline: [
                {
                    type: 'Value.getOutcome',
                    ref: {
                        actionId: 'output',
                        paramName: '$output',
                    },
                    ...overrides
                }
            ]
        }
    ]);
    const outputAction = script.getActionById('output')!;
    const resultAction = script.getActionById('result')!;
    return {
        script,
        outputAction,
        resultAction,
    };
}
