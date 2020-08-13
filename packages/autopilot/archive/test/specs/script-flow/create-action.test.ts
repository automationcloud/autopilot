import assert from 'assert';
import { createTestApp } from '../../globals';
import { util, Action } from '@automationcloud/engine';
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

describe('Sript Flow: Create Action', () => {
    describe(
        'select <main>/actions, add placeholder',
        testSuccess({
            state: {
                path: '/contexts/items/0/children',
                indices: [-1],
            },
            actionType: 'placeholder',
            expectedType: 'placeholder',
            hierarchy: [
                ['/contexts', 'ctxMain', 'main'],
                ['/contexts/items/0/children', '<new>', 'placeholder'],
                ['/contexts', 'ctxA', 'context'],
                ['/contexts/items/1/matchers', 'matA', 'matcher'],
                ['/contexts/items/1/children', 'groupA', 'group'],
                ['/contexts/items/1/children', 'groupB', 'group'],
                ['/contexts', 'ctxB', 'context'],
            ],
        }),
    );

    describe(
        'select ctxA/matchers, add matcher',
        testSuccess({
            state: {
                path: '/contexts/items/1/matchers',
                indices: [-1],
            },
            actionType: 'matcher',
            expectedType: 'matcher',
            hierarchy: [
                ['/contexts', 'ctxMain', 'main'],
                ['/contexts', 'ctxA', 'context'],
                ['/contexts/items/1/matchers', '<new>', 'matcher'],
                ['/contexts/items/1/matchers', 'matA', 'matcher'],
                ['/contexts/items/1/children', 'groupA', 'group'],
                ['/contexts/items/1/children', 'groupB', 'group'],
                ['/contexts', 'ctxB', 'context'],
            ],
        }),
    );

    describe(
        'select ctxA/matchers, add placeholder (coerce)',
        testSuccess({
            state: {
                path: '/contexts/items/1/matchers',
                indices: [-1],
            },
            actionType: 'placeholder',
            expectedType: 'matcher',
            hierarchy: [
                ['/contexts', 'ctxMain', 'main'],
                ['/contexts', 'ctxA', 'context'],
                ['/contexts/items/1/matchers', '<new>', 'matcher'],
                ['/contexts/items/1/matchers', 'matA', 'matcher'],
                ['/contexts/items/1/children', 'groupA', 'group'],
                ['/contexts/items/1/children', 'groupB', 'group'],
                ['/contexts', 'ctxB', 'context'],
            ],
        }),
    );

    describe(
        'select ctxA/children, add matcher (coerce)',
        testSuccess({
            state: {
                path: '/contexts/items/1/children',
                indices: [-1],
            },
            actionType: 'matcher',
            expectedType: 'expect',
            hierarchy: [
                ['/contexts', 'ctxMain', 'main'],
                ['/contexts', 'ctxA', 'context'],
                ['/contexts/items/1/matchers', 'matA', 'matcher'],
                ['/contexts/items/1/children', '<new>', 'expect'],
                ['/contexts/items/1/children', 'groupA', 'group'],
                ['/contexts/items/1/children', 'groupB', 'group'],
                ['/contexts', 'ctxB', 'context'],
            ],
        }),
    );

    describe(
        'select ctxA/groupA, add placeholder (after)',
        testSuccess({
            state: {
                path: '/contexts/items/1/children',
                indices: [0],
            },
            actionType: 'placeholder',
            expectedType: 'placeholder',
            hierarchy: [
                ['/contexts', 'ctxMain', 'main'],
                ['/contexts', 'ctxA', 'context'],
                ['/contexts/items/1/matchers', 'matA', 'matcher'],
                ['/contexts/items/1/children', 'groupA', 'group'],
                ['/contexts/items/1/children', '<new>', 'placeholder'],
                ['/contexts/items/1/children', 'groupB', 'group'],
                ['/contexts', 'ctxB', 'context'],
            ],
        }),
    );

    describe(
        'select ctxA/groupA/children, add placeholder (into)',
        testSuccess({
            state: {
                path: '/contexts/items/1/children/items/0/children',
                indices: [-1],
            },
            actionType: 'placeholder',
            expectedType: 'placeholder',
            hierarchy: [
                ['/contexts', 'ctxMain', 'main'],
                ['/contexts', 'ctxA', 'context'],
                ['/contexts/items/1/matchers', 'matA', 'matcher'],
                ['/contexts/items/1/children', 'groupA', 'group'],
                ['/contexts/items/1/children/items/0/children', '<new>', 'placeholder'],
                ['/contexts/items/1/children', 'groupB', 'group'],
                ['/contexts', 'ctxB', 'context'],
            ],
        }),
    );

    function testSuccess(spec: {
        state: any;
        actionType: string;
        expectedType: string;
        hierarchy: Array<[string, string, string]>;
    }) {
        return () => {
            it('creates an action in desired location', async () => {
                const app = await createApp();
                const script = app.project.script;
                const flow = app.viewports.scriptFlow;
                flow.applyState(spec.state);
                await flow.commands.createAction({ type: spec.actionType });
                const selection = flow.getSelectedItems();
                assert.equal(selection.length, 1);
                assert.ok(selection[0] instanceof Action, 'Expected the selected item to be Action');
                assert.equal(selection[0].type, spec.expectedType);
                const action = selection[0];
                const hierarchy = [...collectHierarchy(script, action.id)];
                assert.deepEqual(hierarchy, spec.hierarchy);
            });

            it('undo: reverts action creation', async () => {
                const app = await createApp();
                const script = app.project.script;
                const scriptJson = util.deepClone(script);

                const flow = app.viewports.scriptFlow;
                flow.applyState(spec.state);
                await flow.commands.createAction({ type: spec.actionType });
                const scriptJsonAfterCmd = util.deepClone(script);
                await flow.commandBuffer.undo();
                const scriptJsonAfterUndo = util.deepClone(script);
                assert.notDeepEqual(scriptJson, scriptJsonAfterCmd);
                assert.deepEqual(scriptJson, scriptJsonAfterUndo);
            });
        };
    }
});

async function createApp() {
    return await createTestApp({
        'project-manager': { script },
    });
}
