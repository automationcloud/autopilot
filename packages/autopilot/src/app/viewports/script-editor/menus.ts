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

import { model, PipeClass } from '@automationcloud/engine';
import { MenuItemConstructorOptions } from 'electron';
import os from 'os';

import { FrequentItemController } from '../../controllers/frequent-item';
import { HelpController } from '../../controllers/help';
import { ModalMenuController, ModalMenuItem } from '../../controllers/modal-menu';
import { ModalsController } from '../../controllers/modals';
import { PipeRecipesController } from '../../controllers/pipe-recipes';
import { dom } from '../../util';
import { buildMenuItems, createLabel } from '../../util/menu';
import { ScriptEditorViewport } from '.';

const standardPipeCategories = [
    'Assert',
    'Boolean',
    'Browser',
    'Date',
    'Definition',
    'DOM',
    'Eval',
    'List',
    'Number',
    'Object',
    'String',
    'Value',
];

export class ScriptEditorMenusController {
    viewport: ScriptEditorViewport;

    constructor(viewport: ScriptEditorViewport) {
        this.viewport = viewport;
    }

    get app() {
        return this.viewport.app;
    }

    get modals() {
        return this.app.get(ModalsController);
    }

    get pipeRecipes() {
        return this.app.get(PipeRecipesController);
    }

    get frequentItems() {
        return this.app.get(FrequentItemController);
    }

    get modalMenu() {
        return this.app.get(ModalMenuController);
    }

    showCreatePipeMenu() {
        this.modalMenu.showItems(this.menuCreatePipe());
    }

    *menuCreatePipe(): IterableIterator<ModalMenuItem> {
        yield {
            label: 'Paste Pipes',
            click: () => this.viewport.commands.pastePipes(),
            enabled: this.viewport.commands.canPastePipes(),
        };
        yield* this.buildPipeCreate();
    }

    showPipeItemMenu() {
        this.modalMenu.showItems(this.menuPipeItem());
    }

    *menuPipeItem() {
        const items = this.viewport.getSelectedItems();
        if (items.length === 0) {
            return;
        }
        const plural = items.length > 1;
        const lbl = plural ? 'pipes' : 'pipe';
        yield {
            label: `Cut ${lbl}`,
            click: () => this.viewport.commands.cutPipes(),
        };
        yield {
            label: `Copy ${lbl}`,
            click: () => this.viewport.commands.copyPipes(),
        };
        yield {
            label: `Delete ${lbl}`,
            click: () => this.viewport.commands.deletePipes(),
        };
        yield { type: 'separator' };
        yield {
            label: `Edit label/notes`,
            enabled: items.length === 1,
            click: () => this.modals.show('edit-pipe-notes'),
        };
        yield {
            label: `Change type...`,
            enabled: items.length === 1,
            submenu: [...this.buildChangePipeType()],
        };
        yield {
            label: `Save pipe${items.length > 1 ? 's' : ''} as recipe...`,
            click: () => this.modals.show('create-pipe-recipe'),
        };
    }

    *menuEdit(): IterableIterator<MenuItemConstructorOptions> {
        yield {
            label: 'Create pipe...',
            accelerator: 'CmdOrCtrl+Shift+A',
            click: () => this.showCreatePipeMenu(),
            enabled: this.viewport.commands.canCreatePipe(),
        };
        if (!dom.isTextEditContext()) {
            yield {
                label: 'Cut selected',
                click: () => this.viewport.commands.cutPipes(),
                accelerator: 'CmdOrCtrl+X',
                enabled: this.viewport.commands.canCutPipes(),
            };
            yield {
                label: 'Copy selected',
                click: () => this.viewport.commands.copyPipes(),
                accelerator: 'CmdOrCtrl+C',
                enabled: this.viewport.commands.canCopyPipes(),
            };
            yield {
                label: 'Paste',
                click: () => this.viewport.commands.pastePipes(),
                accelerator: 'CmdOrCtrl+V',
                enabled: this.viewport.commands.canPastePipes(),
            };
            yield {
                label: 'Delete selected',
                click: () => this.viewport.commands.deletePipes(),
                accelerator: os.platform() === 'darwin' ? 'CmdOrCtrl+Backspace' : 'CmdOrCtrl+Delete',
                enabled: this.viewport.commands.canDeletePipes(),
            };
        }
    }

    // Utilities

    getPipeCategories() {
        return this.app.resolver.getPipeCategories();
    }

    private *buildPipeCreate(): IterableIterator<ModalMenuItem> {
        if (this.frequentItems.isShown()) {
            yield* this.buildFrequentPipes();
        }
        yield { type: 'header', label: 'All Pipes' };
        yield* this.emitCategories(PipeClass => {
            return {
                click: () => this.viewport.commands.createPipe({ type: PipeClass.$type }),
                help: this.app.get(HelpController).getPipeHelp(PipeClass.$type),
            };
        });
        yield* this.buildCreatePipeRecipe();
    }

    private *buildFrequentPipes(): IterableIterator<ModalMenuItem> {
        const pipeTypes = this.frequentItems.getPipeTypes();
        const frequentPipes = pipeTypes
            .map(type => this.app.resolver.getPipeClass(type))
            .filter(Boolean);
        if (frequentPipes.length > 0) {
            yield { type: 'header', label: 'Frequent' };
            for (const PipeClass of frequentPipes) {
                yield {
                    label: PipeClass.$type,
                    htmlLabel: createLabel(PipeClass),
                    click: () => this.viewport.commands.createPipe({ type: PipeClass.$type }),
                    help: this.app.get(HelpController).getPipeHelp(PipeClass.$type),
                    deprecated: PipeClass.$deprecated,
                    searchable: false,
                };
            }
        }
    }

    private *buildCreatePipeRecipe(): IterableIterator<ModalMenuItem> {
        const { pipeGroups } = this.pipeRecipes;
        if (pipeGroups.length) {
            yield { type: 'header', label: 'Recipes' };
            for (const group of pipeGroups) {
                const submenu = group.recipes.map(recipe => {
                    return {
                        label: recipe.name,
                        click: () => this.viewport.commands.insertPipeRecipe(recipe.pipes),
                    };
                });
                yield {
                    label: group.name,
                    submenu,
                };
            }
        }
    }

    private *buildChangePipeType(): IterableIterator<ModalMenuItem> {
        yield* this.emitCategories(PipeClass => {
            return {
                click: () => {
                    this.viewport.commands.changePipeType({
                        type: PipeClass.$type,
                    });
                },
                help: this.app.get(HelpController).getPipeHelp(PipeClass.$type),
            };
        });
    }

    /**
     * Builds action categories which lists standard ones at the top, then separator,
     * then the rest of them in alphabetical order.
     */
    private *emitCategories(itemFn: (pipeClass: PipeClass) => ModalMenuItem): IterableIterator<ModalMenuItem> {
        const categories = this.app.resolver.getPipeCategories().slice();
        for (const std of standardPipeCategories) {
            const idx = categories.findIndex(cat => cat.name === std);
            if (idx > -1) {
                const category = categories[idx];
                categories.splice(idx, 1);
                yield* this.emitCategory(category, itemFn);
            }
        }
        if (categories.length) {
            yield { type: 'separator' };
            for (const category of categories) {
                yield* this.emitCategory(category, itemFn);
            }
        }
    }

    private *emitCategory(
        category: model.Category<PipeClass>,
        itemFn: (pipeClass: PipeClass) => Partial<ModalMenuItem>,
    ): IterableIterator<ModalMenuItem> {
        const submenu = [
            ...buildMenuItems(
                category.name,
                category.items.filter(_ => !_.$hidden),
                itemFn,
            )
        ];
        if (submenu.length) {
            yield {
                label: category.name,
                submenu,
            };
        }
    }

}
