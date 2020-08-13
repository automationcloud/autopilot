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
            matchers: [{ id: 'matA', type: 'matcher' }],
            children: [
                { id: 'groupA', type: 'group' },
                { id: 'groupB', type: 'group' },
            ],
        },
    ],
};

describe('Sript Flow: Change Action Type', () => {
    describe(
        'select context',
        testFailure({
            state: {
                path: '/contexts/items/0',
                indices: [-1],
            },
            actionType: 'click',
        }),
    );

    describe(
        'select actions list',
        testFailure({
            state: {
                path: '/contexts/items/0/children',
                indices: [-1],
            },
            actionType: 'click',
        }),
    );

    describe(
        'select matcher',
        testFailure({
            state: {
                path: '/contexts/items/1/matchers',
                indices: [1],
            },
            actionType: 'click',
        }),
    );

    describe(
        'select multiple actions',
        testFailure({
            state: {
                path: '/contexts/items/1/children',
                indices: [0, 1],
            },
            actionType: 'click',
        }),
    );

    describe(
        'select single action',
        testSuccess({
            state: {
                path: '/contexts/items/1/children',
                indices: [0],
            },
            actionType: 'click',
            hierarchy: [
                ['/contexts', 'ctxMain', 'main'],
                ['/contexts', 'ctxA', 'context'],
                ['/contexts/items/1/matchers', 'matA', 'matcher'],
                ['/contexts/items/1/children', 'groupA', 'click'],
                ['/contexts/items/1/children', 'groupB', 'group'],
            ],
        }),
    );

    function testSuccess(spec: { state: any; actionType: string; hierarchy: Array<[string, string, string]> }) {
        return () => {
            it('changes action type', async () => {
                const app = await createApp();
                const script = app.project.script;
                const flow = app.viewports.scriptFlow;
                flow.applyState(spec.state);
                await flow.commands.changeActionType({ type: spec.actionType });
                const selection = flow.getSelectedItems();
                assert.equal(selection.length, 1);
                assert.ok(selection[0] instanceof Action, 'Expected the selected item to be Action');
                assert.equal(selection[0].type, spec.actionType);
                const hierarchy = [...collectHierarchy(script)];
                assert.deepEqual(hierarchy, spec.hierarchy);
            });

            it('undo: reverts change type', async () => {
                const app = await createApp();
                const script = app.project.script;
                const scriptJson = util.deepClone(script);

                const flow = app.viewports.scriptFlow;
                flow.applyState(spec.state);
                await flow.commands.changeActionType({ type: spec.actionType });
                const scriptJsonAfterCmd = util.deepClone(script);
                await flow.commandBuffer.undo();
                const scriptJsonAfterUndo = util.deepClone(script);
                assert.notDeepEqual(scriptJson, scriptJsonAfterCmd);
                assert.deepEqual(scriptJson, scriptJsonAfterUndo);
            });
        };
    }

    function testFailure(spec: { state: any; actionType: string }) {
        return () => {
            it('does not change any type', async () => {
                const app = await createApp();
                const script = app.project.script;
                const scriptJson = util.deepClone(script);
                const flow = app.viewports.scriptFlow;
                flow.applyState(spec.state);
                await flow.commands.changeActionType({ type: spec.actionType });
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
