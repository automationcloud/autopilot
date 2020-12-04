import { LocalRobot } from '../../main';
import assert from 'assert';

describe('Local Robot', () => {

    describe('waitForOutputs', () => {
        it('resolves specified outputs', async () => {
            const robot = await LocalRobot.create({
                script: createScript([
                    {
                        type: 'Flow.output',
                        outputKey: 'foo',
                        pipeline: [
                            { type: 'Value.getJson', value: '{ data: 1 }' },
                        ]
                    },
                    {
                        type: 'Flow.output',
                        outputKey: 'bar',
                        pipeline: [
                            { type: 'Value.getJson', value: '{ data: 2 }' },
                        ]
                    }
                ]),
            });
            const finish = robot.run();
            const [foo, bar] = await robot.waitForOutputs('foo', 'bar');
            assert.deepStrictEqual(foo, { data: 1 });
            assert.deepStrictEqual(bar, { data: 2 });
            await finish;
        });
    });

    describe('inputs', () => {

        const script = createScript([
            {
                type: 'Flow.output',
                outputKey: 'echo',
                pipeline: [
                    {
                        type: 'Value.getInput',
                        inputKey: 'value'
                    }
                ]
            }
        ]);

        context('input pre-supplied', () => {
            it('resolves input immediately', async () => {
                const robot = await LocalRobot.create({ script });
                await robot.run({
                    value: { foo: 1 }
                });
                const [echo] = await robot.waitForOutputs('echo');
                assert.deepStrictEqual(echo, { foo: 1 });
            });
        });

        context('input requested, but not provided', () => {
            it('rejects after input timeout', async () => {
                const robot = await LocalRobot.create({ script, inputTimeout: 50 });
                try {
                    await robot.run();
                    throw new Error('UnexpectedSuccess');
                } catch (err) {
                    assert.strictEqual(err.name, 'InputTimeout');
                    assert.strictEqual(err.details.key, 'value');
                }
            });
        });

        context('input requested and provided', () => {
            it('resolves input', async () => {
                const robot = await LocalRobot.create({ script });
                const finish = robot.run();
                robot.onAwaitingInput('value', async () => {
                    // Support async
                    await Promise.resolve();
                    return { bar: 2 };
                });
                const [echo] = await robot.waitForOutputs('echo');
                assert.deepStrictEqual(echo, { bar: 2 });
                await finish;
            });
        });

        describe('submitInput', () => {
            it('adds input', async () => {
                const robot = await LocalRobot.create({ script });
                robot.submitInput('value', { baz: 222 });
                const finish = robot.run();
                const [echo] = await robot.waitForOutputs('echo');
                assert.deepStrictEqual(echo, { baz: 222 });
                await finish;
            });
        });
    });

});

function createScript(actions: any[]) {
    return {
        id: 'test-script',
        contexts: [
            {
                type: 'main',
                children: actions,
            }
        ],
    };
}
