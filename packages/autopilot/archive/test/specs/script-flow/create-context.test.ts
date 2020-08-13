import assert from 'assert';
import { createTestApp } from '../../globals';
import { Context, util } from '@automationcloud/engine';
import { collectHierarchy } from '../../helpers';

const script = {
    name: 'foo',
    contexts: [
        { id: 'ctxMain', type: 'main' },
        { id: 'ctxA', type: 'context', name: 'A', actions: [{ id: 'act', type: 'placeholder' }] },
        { id: 'ctxB', type: 'context', name: 'B' },
    ],
};

describe('Script Flow: Create Context', () => {
    describe(
        'select script',
        testSuccess({
            state: { path: '', indices: [] },
            hierarchy: [
                ['/contexts', 'ctxMain', 'main'],
                ['/contexts', 'ctxA', 'context'],
                ['/contexts/items/1/children', 'act', 'placeholder'],
                ['/contexts', 'ctxB', 'context'],
                ['/contexts', '<new>', 'context'],
            ],
        }),
    );

    describe(
        'select main context',
        testSuccess({
            state: { path: '/contexts', indices: [0] },
            hierarchy: [
                ['/contexts', 'ctxMain', 'main'],
                ['/contexts', '<new>', 'context'],
                ['/contexts', 'ctxA', 'context'],
                ['/contexts/items/2/children', 'act', 'placeholder'],
                ['/contexts', 'ctxB', 'context'],
            ],
        }),
    );

    describe(
        'select other context',
        testSuccess({
            state: { path: '/contexts', indices: [1] },
            hierarchy: [
                ['/contexts', 'ctxMain', 'main'],
                ['/contexts', 'ctxA', 'context'],
                ['/contexts/items/1/children', 'act', 'placeholder'],
                ['/contexts', '<new>', 'context'],
                ['/contexts', 'ctxB', 'context'],
            ],
        }),
    );

    describe(
        'select action',
        testFailure({
            state: { path: '/contexts/items/1/children', indices: [0] },
        }),
    );

    function testSuccess(spec: { state: any; hierarchy: Array<[string, string, string]> }) {
        return () => {
            it('creates context in desired location', async () => {
                const app = await createApp();
                const script = app.project.script;
                const flow = app.viewports.scriptFlow;
                flow.applyState(spec.state);
                await flow.commands.createContext('context');
                const newCtx = flow.getLastSelectedItem() as Context;
                assert.equal(newCtx.name, 'New Context');
                const hierarchy = [...collectHierarchy(script, newCtx.id)];
                assert.deepEqual(hierarchy, spec.hierarchy);
            });

            it('undo: reverts context creation', async () => {
                const app = await createApp();
                const script = app.project.script;
                const flow = app.viewports.scriptFlow;
                flow.applyState(spec.state);
                const scriptJson = util.deepClone(script);
                await flow.commands.createContext('context');
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
            it('does not create', async () => {
                const app = await createApp();
                const script = app.project.script;
                const scriptJson = util.deepClone(script);
                const flow = app.viewports.scriptFlow;
                flow.applyState(spec.state);
                await flow.commands.createContext('context');
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
