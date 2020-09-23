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

import { runtime } from '../runtime';
import assert from 'assert';

describe('Checkpoint', () => {
    beforeEach(async () => {
        await runtime.helpers.runNewExecution({
            id: 'checkpoint-create',
            serviceId: 'checkpoint',
            input: {
                foo: '12',
                bar: '34',
            },
        });
    });

    it('does not throw error', async () => {
        const execution = await runtime.helpers.getExecutionById('checkpoint-create');
        assert(execution.error == null);
    });

    it('creates a checkpoint', async () => {
        const execution = await runtime.helpers.getExecutionById('checkpoint-create');
        assert.equal(execution.$checkpoints.length, 1);
        assert(execution.$checkpoints[0].url.endsWith('/cookies.html'));
        assert.equal(execution.output.echoFoo, '12');
        assert.equal(execution.output.echoBar, '34');
        const checkpoint = execution.$checkpoints[0];
        assert(checkpoint);
        assert.deepEqual(checkpoint.consumedInputKeys, ['foo']);
        // In normal executions <main> context is executed, but <checkpoint> is not
        assert.equal(execution.output.mainContextCalled, true);
        assert(execution.output.checkpointContextCalled == null);
    });

    it('restores a checkpoint', async () => {
        const execution = await runtime.helpers.getExecutionById('checkpoint-create');
        const checkpoint = execution.$checkpoints[0];
        assert.deepEqual(checkpoint.consumedInputKeys, ['foo']);
        await runtime.helpers.runNewExecution({
            id: 'checkpoint-restore',
            serviceId: 'checkpoint',
            checkpointId: checkpoint.id,
            input: {
                foo: '56',
                bar: '78',
            },
        });
        const nextExecution = await runtime.helpers.getExecutionById('checkpoint-restore');
        assert(nextExecution.output.cookies.includes('foo=bar'));
        const nextCheckpoint = nextExecution.$checkpoints[0];
        assert(nextCheckpoint);
        assert.deepEqual(nextCheckpoint.consumedInputKeys, []);
        // In executions with checkpoints, <checkpoint> context is called, but not <main>
        assert(nextExecution.output.mainContextCalled == null);
        assert.equal(nextExecution.output.checkpointContextCalled, true);
    });
});
