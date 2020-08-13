import assert from 'assert';
import { createTestApp } from '../../globals';
import { Script, util } from '@automationcloud/engine';

const script = {
    name: 'foo',
    contexts: [
        { id: 'ctxMain', type: 'main' },
        { id: 'ctxA', type: 'context', name: 'A', actions: [{ id: 'act', type: 'placeholder' }] },
        { id: 'ctxB', type: 'context', name: 'B' },
        { id: 'ctxC', type: 'context', name: 'C' },
        { id: 'ctxD', type: 'context', name: 'D' },
        { id: 'ctxE', type: 'context', name: 'E' },
    ],
};

describe('Script Flow: Delete Context', () => {
    describe(
        'no context selected',
        testCtxDelete(script => [script.getActionById('act')], ['ctxMain', 'ctxA', 'ctxB', 'ctxC', 'ctxD', 'ctxE']),
    );

    describe(
        'single context',
        testCtxDelete(script => [script.getContextById('ctxA')], ['ctxMain', 'ctxB', 'ctxC', 'ctxD', 'ctxE']),
    );

    describe(
        'two contexts',
        testCtxDelete(script => [script.getContextById('ctxA'), script.getContextById('ctxC')], [
            'ctxMain',
            'ctxB',
            'ctxD',
            'ctxE',
        ]),
    );

    describe(
        'three contexts',
        testCtxDelete(
            script => [script.getContextById('ctxA'), script.getContextById('ctxC'), script.getContextById('ctxD')],
            ['ctxMain', 'ctxB', 'ctxE'],
        ),
    );

    describe(
        '<main> + three contexts',
        testCtxDelete(
            script => [
                script.getContextById('ctxMain'),
                script.getContextById('ctxA'),
                script.getContextById('ctxC'),
                script.getContextById('ctxD'),
            ],
            ['ctxMain', 'ctxB', 'ctxE'],
        ),
    );

    function testCtxDelete(selection: (script: Script) => any[], expectedContextIds: string[]) {
        return () => {
            it('removes selected contexts', async () => {
                const app = await createApp();
                const flow = app.viewports.scriptFlow;
                const script = app.project.script;
                const sel = selection(script);
                flow.selectItems(sel);
                await flow.commands.delete();

                assert.equal(script.contexts.length, expectedContextIds.length);
                const ctxIds = script.contexts.map(_ => _.id);
                assert.deepEqual(ctxIds, expectedContextIds);
            });

            it('undo: reverts context deletion', async () => {
                const app = await createApp();
                const flow = app.viewports.scriptFlow;
                const script = app.project.script;
                const scriptJson = util.deepClone(script);

                const sel = selection(script);
                flow.selectItems(sel);
                const selectedIds = flow.getSelectedItems().map(_ => _.id);
                await flow.commands.delete();
                assert.equal(script.contexts.length, expectedContextIds.length);

                await flow.getCommandBuffer().undo();
                assert.deepEqual(util.deepClone(script), scriptJson);
                assert.equal(flow.getSelectedItems().length, sel.length);
                assert.deepEqual(
                    selectedIds,
                    flow.getSelectedItems().map(_ => _.id),
                );
            });
        };
    }
});

async function createApp() {
    return await createTestApp({
        'project-manager': { script },
    });
}
