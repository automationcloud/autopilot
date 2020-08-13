import { runtime } from '../runtime';
import { WorkerState } from '../../main/services/state';
import { SignalsService } from '../../main/services/signals';
import assert from 'assert';

describe('Worker', () => {
    describe('happy case', () => {
        beforeEach(async () => {
            await runtime.helpers.runNewExecution({
                id: 'happy',
                serviceId: 'happy',
                ip: 'someRoxiIpAddress',
                proxyId: 'someRoxyIpAddressId',
                input: {
                    account: {
                        name: 'Jane Norman',
                    },
                },
            });
        });

        it('does not throw error', async () => {
            const { error } = await runtime.helpers.getExecutionById('happy');
            assert(error == null);
        });

        it('updates execution state to success', async () => {
            const { state } = await runtime.helpers.getExecutionById('happy');
            assert.equal(state, 'success');
        });

        it('updates execution output', async () => {
            const { output } = await runtime.helpers.getExecutionById('happy');
            assert.deepEqual(output, {
                object: {
                    upperCasedName: 'JANE NORMAN',
                },
            });
        });

        it('has no execution error', async () => {
            const { error } = await runtime.helpers.getExecutionById('happy');
            assert(error == null);
        });
    });

    describe('unhappy case (no pending)', () => {
        beforeEach(async () => {
            await runtime.helpers.runNewExecution({
                id: 'unhappy',
                serviceId: 'failure',
                ip: 'someOtherRoxiIp',
                input: {
                    account: {
                        name: 'Josie Thorpe',
                    },
                },
            });
        });

        it('has error', async () => {
            const { error } = await runtime.helpers.getExecutionById('unhappy');
            assert.equal(error.code, 'SelectorNotFound');
        });

        it('updates execution state to fail', async () => {
            const { state } = await runtime.helpers.getExecutionById('unhappy');
            assert.equal(state, 'fail');
        });

        it('has no output', async () => {
            const { output } = await runtime.helpers.getExecutionById('unhappy');
            assert.deepEqual(output, {});
        });
    });

    describe('execution terminated', () => {
        beforeEach(async () => {
            const promise = runtime.helpers.runNewExecution({
                id: 'happy-terminated',
                serviceId: 'happy',
                ip: 'someRoxiIpAddress',
                proxyId: 'someRoxyIpAddressId',
                input: {
                    account: {
                        name: 'Jane Norman',
                    },
                },
            });
            // polling till worker becomes 'running', then terminating
            while (true) {
                const state = runtime.app.container.get(WorkerState);
                const signals = runtime.app.container.get(SignalsService);
                if (state.state === 'running') {
                    signals.handleExecutionStateUpdate({ state: 'terminated' });
                    break;
                }
                await new Promise(r => setTimeout(r, 10));
            }
            return await promise;
        });

        it('has error', async () => {
            const { error } = await runtime.helpers.getExecutionById('happy-terminated');
            assert.equal(error.code, 'ExecutionTerminated');
        });

        it('updates execution state to fail', async () => {
            const { state } = await runtime.helpers.getExecutionById('happy-terminated');
            assert.equal(state, 'fail');
        });
    });
});
