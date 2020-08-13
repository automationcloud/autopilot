import assert from 'assert';
import { createTestApp } from '../../globals';
import { util } from '@automationcloud/engine';
import { clipboard } from '../../../main';
import { collectHierarchy } from '../../helpers';

const script = {
    name: 'foo',
    contexts: [
        { id: 'ctxMain', type: 'main' },
        {
            id: 'ctxA',
            type: 'context',
            name: 'A',
            matchers: [{ id: 'matA', type: 'placeholder' }],
            children: [
                { id: 'groupA', type: 'group' },
                { id: 'groupB', type: 'group' },
            ],
        },
        { id: 'ctxB', type: 'context', name: 'B' },
    ],
};

describe('Script Flow: Paste', () => {
    afterEach(() => clipboard.writeObject({}));

    describe('clipboard: contexts', () => {
        beforeEach(() => {
            clipboard.writeObject({
                type: 'contexts',
                data: [{ id: 'ctxC' }, { id: 'ctxD' }],
            });
        });

        describe(
            'select none',
            testSuccess({
                state: {
                    path: '',
                    indices: [-1],
                },
                hierarchy: [
                    ['/contexts', 'ctxMain', 'main'],
                    ['/contexts', 'ctxA', 'context'],
                    ['/contexts/items/1/matchers', 'matA', 'matcher'],
                    ['/contexts/items/1/children', 'groupA', 'group'],
                    ['/contexts/items/1/children', 'groupB', 'group'],
                    ['/contexts', 'ctxB', 'context'],
                    ['/contexts', 'ctxC', 'context'],
                    ['/contexts', 'ctxD', 'context'],
                ],
            }),
        );

        describe(
            'select context',
            testSuccess({
                state: {
                    path: '/contexts',
                    indices: [0],
                },
                hierarchy: [
                    ['/contexts', 'ctxMain', 'main'],
                    ['/contexts', 'ctxC', 'context'],
                    ['/contexts', 'ctxD', 'context'],
                    ['/contexts', 'ctxA', 'context'],
                    ['/contexts/items/3/matchers', 'matA', 'matcher'],
                    ['/contexts/items/3/children', 'groupA', 'group'],
                    ['/contexts/items/3/children', 'groupB', 'group'],
                    ['/contexts', 'ctxB', 'context'],
                ],
            }),
        );

        describe(
            'select other context',
            testSuccess({
                state: {
                    path: '/contexts',
                    indices: [1],
                },
                hierarchy: [
                    ['/contexts', 'ctxMain', 'main'],
                    ['/contexts', 'ctxA', 'context'],
                    ['/contexts/items/1/matchers', 'matA', 'matcher'],
                    ['/contexts/items/1/children', 'groupA', 'group'],
                    ['/contexts/items/1/children', 'groupB', 'group'],
                    ['/contexts', 'ctxC', 'context'],
                    ['/contexts', 'ctxD', 'context'],
                    ['/contexts', 'ctxB', 'context'],
                ],
            }),
        );

        describe(
            'select action',
            testFailure({
                state: {
                    path: '/contexts/items/1/children',
                    indices: [1],
                },
            }),
        );
    });

    describe('clipboard: actions', () => {
        beforeEach(() => {
            clipboard.writeObject({
                type: 'actions',
                data: [
                    { id: 'actA', type: 'placeholder' },
                    { id: 'actB', type: 'placeholder' },
                ],
            });
        });

        describe(
            'select none',
            testFailure({
                state: {
                    path: '',
                    indices: [-1],
                },
            }),
        );

        describe(
            'select context',
            testFailure({
                state: {
                    path: '/contexts',
                    indices: [0],
                },
            }),
        );

        describe(
            'select matchers list (coerce)',
            testSuccess({
                state: {
                    path: '/contexts/items/1/matchers',
                    indices: [-1],
                },
                hierarchy: [
                    ['/contexts', 'ctxMain', 'main'],
                    ['/contexts', 'ctxA', 'context'],
                    ['/contexts/items/1/matchers', 'actA', 'matcher'],
                    ['/contexts/items/1/matchers', 'actB', 'matcher'],
                    ['/contexts/items/1/matchers', 'matA', 'matcher'],
                    ['/contexts/items/1/children', 'groupA', 'group'],
                    ['/contexts/items/1/children', 'groupB', 'group'],
                    ['/contexts', 'ctxB', 'context'],
                ],
            }),
        );

        describe(
            'select matcher (coerce)',
            testSuccess({
                state: {
                    path: '/contexts/items/1/matchers',
                    indices: [0],
                },
                hierarchy: [
                    ['/contexts', 'ctxMain', 'main'],
                    ['/contexts', 'ctxA', 'context'],
                    ['/contexts/items/1/matchers', 'matA', 'matcher'],
                    ['/contexts/items/1/matchers', 'actA', 'matcher'],
                    ['/contexts/items/1/matchers', 'actB', 'matcher'],
                    ['/contexts/items/1/children', 'groupA', 'group'],
                    ['/contexts/items/1/children', 'groupB', 'group'],
                    ['/contexts', 'ctxB', 'context'],
                ],
            }),
        );

        describe(
            'select actions list',
            testSuccess({
                state: {
                    path: '/contexts/items/0/children',
                    indices: [-1],
                },
                hierarchy: [
                    ['/contexts', 'ctxMain', 'main'],
                    ['/contexts/items/0/children', 'actA', 'placeholder'],
                    ['/contexts/items/0/children', 'actB', 'placeholder'],
                    ['/contexts', 'ctxA', 'context'],
                    ['/contexts/items/1/matchers', 'matA', 'matcher'],
                    ['/contexts/items/1/children', 'groupA', 'group'],
                    ['/contexts/items/1/children', 'groupB', 'group'],
                    ['/contexts', 'ctxB', 'context'],
                ],
            }),
        );

        describe(
            'select action',
            testSuccess({
                state: {
                    path: '/contexts/items/1/children',
                    indices: [1],
                },
                hierarchy: [
                    ['/contexts', 'ctxMain', 'main'],
                    ['/contexts', 'ctxA', 'context'],
                    ['/contexts/items/1/matchers', 'matA', 'matcher'],
                    ['/contexts/items/1/children', 'groupA', 'group'],
                    ['/contexts/items/1/children', 'groupB', 'group'],
                    ['/contexts/items/1/children', 'actA', 'placeholder'],
                    ['/contexts/items/1/children', 'actB', 'placeholder'],
                    ['/contexts', 'ctxB', 'context'],
                ],
            }),
        );

        describe(
            'select definitions list (coerce)',
            testSuccess({
                state: {
                    path: '/contexts/items/1/definitions',
                    indices: [-1],
                },
                hierarchy: [
                    ['/contexts', 'ctxMain', 'main'],
                    ['/contexts', 'ctxA', 'context'],
                    ['/contexts/items/1/matchers', 'matA', 'matcher'],
                    ['/contexts/items/1/children', 'groupA', 'group'],
                    ['/contexts/items/1/children', 'groupB', 'group'],
                    ['/contexts/items/1/definitions', 'actA', 'definition'],
                    ['/contexts/items/1/definitions', 'actB', 'definition'],
                    ['/contexts', 'ctxB', 'context'],
                ],
            }),
        );

        describe('clipboard: random content', () => {
            beforeEach(() => {
                clipboard.writeObject({ foo: 'bar' });
            });

            describe(
                'select none',
                testFailure({
                    state: { path: '', indices: [-1] },
                }),
            );

            describe(
                'select context',
                testFailure({
                    state: { path: '/contexts', indices: [0] },
                }),
            );

            describe(
                'select actions list',
                testFailure({
                    state: { path: '/contexts/items/1/children', indices: [-1] },
                }),
            );

            describe(
                'select action',
                testFailure({
                    state: { path: '/contexts/items/1/children', indices: [0] },
                }),
            );
        });
    });

    function testSuccess(spec: { state: any; hierarchy: Array<[string, string, string]> }) {
        return () => {
            it('paste objects in desired location', async () => {
                const app = await createApp();
                const script = app.project.script;
                const flow = app.viewports.scriptFlow;
                flow.applyState(spec.state);
                await flow.commands.paste();
                const hierarchy = [...collectHierarchy(script)];
                assert.deepEqual(hierarchy, spec.hierarchy);
            });

            it('undo: reverts paste', async () => {
                const app = await createApp();
                const script = app.project.script;
                const scriptJson = util.deepClone(script);

                const flow = app.viewports.scriptFlow;
                flow.applyState(spec.state);
                await flow.commands.paste();
                const scriptJsonAfterCmd = util.deepClone(script);
                await flow.commandBuffer.undo();
                const scriptJsonAfterUndo = util.deepClone(script);
                assert.notDeepEqual(scriptJson, scriptJsonAfterCmd);
                assert.deepEqual(scriptJson, scriptJsonAfterUndo);
            });
        };
    }

    function testFailure(spec: { state: any }) {
        return () => {
            it('does not paste', async () => {
                const app = await createApp();
                const script = app.project.script;
                const scriptJson = util.deepClone(script);
                const flow = app.viewports.scriptFlow;
                flow.applyState(spec.state);
                await flow.commands.paste();
                const scriptJsonAfterCmd = util.deepClone(script);
                assert.deepEqual(scriptJson, scriptJsonAfterCmd);
                assert.equal(flow.getCommandBuffer().canUndo(), false);
            });
        };
    }
});

async function createApp() {
    return await createTestApp({
        'project-manager': { script },
    });
}
