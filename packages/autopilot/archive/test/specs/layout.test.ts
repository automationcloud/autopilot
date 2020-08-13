import assert from 'assert';
import { createTestApp } from '../globals';
import { LayoutDirection, LayoutItemType } from '../../main';

describe('Layout', () => {
    it('loads layout from UserData', async () => {
        const app = await createTestApp({
            layout: {
                root: {
                    type: 'viewport',
                    viewportId: 'A',
                },
            },
        });
        assert.equal(app.layout.root.type, 'viewport');
        assert.equal(app.layout.root.viewportId, 'A');
    });

    describe('repack', () => {
        it('collapses nested rows', async () => {
            const app = await createTestApp({
                layout: {
                    root: {
                        type: 'row',
                        children: [
                            { type: 'viewport', viewportId: 'A' },
                            {
                                type: 'row',
                                children: [
                                    { type: 'viewport', viewportId: 'B' },
                                    { type: 'viewport', viewportId: 'C' },
                                ],
                            },
                            { type: 'viewport', viewportId: 'D' },
                        ],
                    },
                },
            });
            assert.equal(app.layout.root.type, 'row');
            assert.equal(app.layout.root.children.length, 4);
            for (const child of app.layout.root.children) {
                assert.equal(child.$parent, app.layout.root);
            }
        });

        it('collapses nested columns', async () => {
            const app = await createTestApp({
                layout: {
                    root: {
                        type: 'column',
                        children: [
                            { type: 'viewport', viewportId: 'A' },
                            {
                                type: 'column',
                                children: [
                                    { type: 'viewport', viewportId: 'B' },
                                    { type: 'viewport', viewportId: 'C' },
                                ],
                            },
                            { type: 'viewport', viewportId: 'D' },
                        ],
                    },
                },
            });
            assert.equal(app.layout.root.type, 'column');
            assert.equal(app.layout.root.children.length, 4);
            for (const child of app.layout.root.children) {
                assert.equal(child.$parent, app.layout.root);
            }
        });

        it('collapses a container with a single child', async () => {
            const app = await createTestApp({
                layout: {
                    root: {
                        type: 'column',
                        children: [
                            { type: 'viewport', viewportId: 'A' },
                            {
                                type: 'row',
                                children: [{ type: 'viewport', viewportId: 'B' }],
                            },
                            { type: 'viewport', viewportId: 'C' },
                        ],
                    },
                },
            });
            assert.equal(app.layout.root.type, 'column');
            assert.equal(app.layout.root.children.length, 3);
            for (const child of app.layout.root.children) {
                assert.equal(child.$parent, app.layout.root);
            }
        });

        it('collapses single child containers recursively', async () => {
            const app = await createTestApp({
                layout: {
                    root: {
                        type: 'column',
                        children: [
                            {
                                type: 'row',
                                children: [{ type: 'viewport', viewportId: 'A' }],
                            },
                        ],
                    },
                },
            });
            assert.equal(app.layout.root.type, 'viewport');
            assert.equal(app.layout.root.viewportId, 'A');
        });

        it('integration', async () => {
            const app = await createTestApp({
                layout: {
                    root: {
                        type: 'column',
                        children: [
                            {
                                type: 'row',
                                children: [{ type: 'viewport', viewportId: 'A' }],
                            },
                            {
                                type: 'column',
                                children: [
                                    { type: 'viewport', viewportId: 'B' },
                                    { type: 'viewport', viewportId: 'C' },
                                ],
                            },
                            {
                                type: 'column',
                                children: [
                                    {
                                        type: 'row',
                                        children: [{ type: 'viewport', viewportId: 'D' }],
                                    },
                                ],
                            },
                            { type: 'viewport', viewportId: 'E' },
                        ],
                    },
                },
            });
            assert.equal(app.layout.root.type, 'column');
            assert.equal(app.layout.root.children.length, 5);
            assert.deepEqual(
                app.layout.root.children.map(_ => _.viewportId),
                ['A', 'B', 'C', 'D', 'E'],
            );
        });
    });

    describe('split', () => {
        describe('applied to root', () => {
            function createTestCase(
                splitDirection: LayoutDirection,
                expectedRootType: LayoutItemType,
                expectedChildrenOrder: string[],
            ) {
                return async () => {
                    const app = await createTestApp({
                        layout: {
                            root: { type: 'viewport', viewportId: 'A' },
                        },
                    });
                    const newViewport = app.layout.createDetachedItem({ type: 'viewport', viewportId: 'B' });
                    app.layout.split(app.layout.root, newViewport, splitDirection);
                    assert.equal(app.layout.root.type, expectedRootType);
                    assert.equal(app.layout.root.children.length, 2);
                    assert.deepEqual(
                        app.layout.root.children.map(_ => _.viewportId),
                        expectedChildrenOrder,
                    );
                    assert.equal(app.layout.root.children[0].$parent, app.layout.root);
                    assert.equal(app.layout.root.children[1].$parent, app.layout.root);
                };
            }

            it('splits horizontally (left)', createTestCase('left', 'row', ['B', 'A']));
            it('splits horizontally (right)', createTestCase('right', 'row', ['A', 'B']));
            it('splits vertically (top)', createTestCase('top', 'column', ['B', 'A']));
            it('splits vertically (bottom)', createTestCase('bottom', 'column', ['A', 'B']));
        });

        describe('applied to column', async () => {
            it('splits child horizontally', async () => {
                const app = await createTestApp({
                    layout: {
                        root: {
                            type: 'column',
                            children: [
                                { type: 'viewport', viewportId: 'A' },
                                { type: 'viewport', viewportId: 'B' },
                                { type: 'viewport', viewportId: 'C' },
                            ],
                        },
                    },
                });
                const newViewport = app.layout.createDetachedItem({ type: 'viewport', viewportId: 'N' });
                const b = app.layout.findByViewportId('B')!;
                app.layout.split(b, newViewport, 'left');
                assert.equal(app.layout.root.children.length, 3);
                assert.equal(app.layout.root.children[0].type, 'viewport');
                assert.equal(app.layout.root.children[1].type, 'row');
                assert.equal(app.layout.root.children[2].type, 'viewport');
                const newRow = app.layout.root.children[1];
                assert.equal(newRow.children.length, 2);
                assert.equal(newRow.children[0].viewportId, 'N');
                assert.equal(newRow.children[1].viewportId, 'B');
            });

            it('splits child vertically without producing more layout', async () => {
                const app = await createTestApp({
                    layout: {
                        root: {
                            type: 'column',
                            children: [
                                { type: 'viewport', viewportId: 'A' },
                                { type: 'viewport', viewportId: 'B' },
                                { type: 'viewport', viewportId: 'C' },
                            ],
                        },
                    },
                });
                const newViewport = app.layout.createDetachedItem({ type: 'viewport', viewportId: 'N' });
                const b = app.layout.findByViewportId('B')!;
                app.layout.split(b, newViewport, 'top');
                assert.equal(app.layout.root.children.length, 4);
                assert.equal(app.layout.root.children[0].type, 'viewport');
                assert.equal(app.layout.root.children[1].type, 'viewport');
                assert.equal(app.layout.root.children[2].type, 'viewport');
                assert.equal(app.layout.root.children[3].type, 'viewport');
                assert.deepEqual(
                    app.layout.root.children.map(_ => _.viewportId),
                    ['A', 'N', 'B', 'C'],
                );
            });
        });

        describe('applied to row', async () => {
            it('splits child vertically', async () => {
                const app = await createTestApp({
                    layout: {
                        root: {
                            type: 'row',
                            children: [
                                { type: 'viewport', viewportId: 'A' },
                                { type: 'viewport', viewportId: 'B' },
                                { type: 'viewport', viewportId: 'C' },
                            ],
                        },
                    },
                });
                const newViewport = app.layout.createDetachedItem({ type: 'viewport', viewportId: 'N' });
                const b = app.layout.findByViewportId('B')!;
                app.layout.split(b, newViewport, 'top');
                assert.equal(app.layout.root.children.length, 3);
                assert.equal(app.layout.root.children[0].type, 'viewport');
                assert.equal(app.layout.root.children[1].type, 'column');
                assert.equal(app.layout.root.children[2].type, 'viewport');
                const newRow = app.layout.root.children[1];
                assert.equal(newRow.children.length, 2);
                assert.equal(newRow.children[0].viewportId, 'N');
                assert.equal(newRow.children[1].viewportId, 'B');
            });

            it('splits child horizontally without producing more layout', async () => {
                const app = await createTestApp({
                    layout: {
                        root: {
                            type: 'row',
                            children: [
                                { type: 'viewport', viewportId: 'A' },
                                { type: 'viewport', viewportId: 'B' },
                                { type: 'viewport', viewportId: 'C' },
                            ],
                        },
                    },
                });
                const newViewport = app.layout.createDetachedItem({ type: 'viewport', viewportId: 'N' });
                const b = app.layout.findByViewportId('B')!;
                app.layout.split(b, newViewport, 'left');
                assert.equal(app.layout.root.children.length, 4);
                assert.equal(app.layout.root.children[0].type, 'viewport');
                assert.equal(app.layout.root.children[1].type, 'viewport');
                assert.equal(app.layout.root.children[2].type, 'viewport');
                assert.equal(app.layout.root.children[3].type, 'viewport');
                assert.deepEqual(
                    app.layout.root.children.map(_ => _.viewportId),
                    ['A', 'N', 'B', 'C'],
                );
            });
        });

        it('integration', async () => {
            const app = await createTestApp({
                layout: {
                    root: {
                        type: 'row',
                        children: [
                            { type: 'viewport', viewportId: 'A' },
                            {
                                type: 'column',
                                children: [
                                    { type: 'viewport', viewportId: 'B' },
                                    { type: 'viewport', viewportId: 'C' },
                                    { type: 'viewport', viewportId: 'D' },
                                ],
                            },
                        ],
                    },
                },
            });
            const a = app.layout.findByViewportId('A')!;
            const b = app.layout.findByViewportId('B')!;
            const c = app.layout.findByViewportId('C')!;
            const x = app.layout.createDetachedItem({ type: 'viewport', viewportId: 'X' });
            const y = app.layout.createDetachedItem({ type: 'viewport', viewportId: 'Y' });
            const z = app.layout.createDetachedItem({ type: 'viewport', viewportId: 'Z' });
            app.layout.split(a, x, 'right');
            app.layout.split(b, y, 'bottom');
            app.layout.split(c, z, 'left');
            assert.deepEqual(
                app.layout.root.children.map(_ => _.viewportId),
                ['A', 'X', null],
            );
            const col = app.layout.root.children[2];
            assert.deepEqual(
                col.children.map(_ => _.viewportId),
                ['B', 'Y', null, 'D'],
            );
            const nestedRow = col.children[2];
            assert.deepEqual(
                nestedRow.children.map(_ => _.viewportId),
                ['Z', 'C'],
            );
            // All together
            const viewports = [...app.layout.root.searchByType('viewport')];
            assert.deepEqual(
                viewports.map(_ => _.viewportId),
                ['A', 'X', 'B', 'Y', 'Z', 'C', 'D'],
            );
        });
    });
});
