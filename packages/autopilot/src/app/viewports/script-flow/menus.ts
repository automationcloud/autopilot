import os from 'os';
import { ModalMenuItem } from '../../ui/modal-menu';
import {
    ContextList,
    MatcherList,
    DefinitionList,
    ActionList,
    ActionClass,
    model,
} from '@automationcloud/engine';
import { ScriptFlowViewport } from '.';
import { dom } from '../../util';
import { MenuItemConstructorOptions } from 'electron';
import { InputDef, Domain } from '@ubio/protocol';

const standardActionCategories = [
    'Page',
    'Flow',
    'Global',
    'Eval',
];

export class ScriptFlowMenusController {
    viewport: ScriptFlowViewport;

    constructor(viewport: ScriptFlowViewport) {
        this.viewport = viewport;
    }

    get app() {
        return this.viewport.app;
    }

    showCreateMenu() {
        const items = [...this.menuCreate()];
        if (items.length) {
            this.app.ui.modalMenu.show(items);
        }
    }

    *menuCreate(): IterableIterator<ModalMenuItem> {
        const list = this.viewport.getSelectedList();
        if (list instanceof ActionList) {
            yield* this.menuCreateAction(list);
        }
        if (list instanceof ContextList) {
            yield* this.menuCreateContext();
        }
    }

    *menuCreateContext(): IterableIterator<ModalMenuItem> {
        yield {
            label: 'Create Context',
            click: () => this.viewport.commands.createContext('context'),
            enabled: this.viewport.commands.canCreateContext('context'),
        };
        yield {
            label: 'Create Checkpoint Context',
            click: () => this.viewport.commands.createContext('checkpoint'),
            enabled: this.viewport.commands.canCreateContext('checkpoint'),
        };
        yield {
            label: 'Paste Contexts',
            click: () => this.viewport.commands.paste(),
            enabled: this.viewport.commands.canPaste(),
        };
    }

    *menuCreateAction(list: ActionList): IterableIterator<ModalMenuItem> {
        yield {
            label: 'Paste Actions',
            click: () => this.viewport.commands.paste(),
            enabled: this.viewport.commands.canPaste(),
        };
        yield* this.buildActionCreate(list);
    }

    showContextItemMenu() {
        const items = [...this.menuContextItem()];
        if (items.length) {
            this.app.ui.modalMenu.show(items);
        }
    }

    *menuContextItem(): IterableIterator<ModalMenuItem> {
        if (!this.viewport.isContextSelected()) {
            return;
        }
        const plural = this.viewport.getSelectedItems().length > 1;
        const lbl = plural ? 'contexts' : 'context';
        yield {
            label: `Cut ${lbl}`,
            click: () => this.viewport.commands.cut(),
            // TODO add check that <main> can't be cut
        };
        yield {
            label: `Copy ${lbl}`,
            click: () => this.viewport.commands.copy(),
        };
        yield {
            label: `Delete ${lbl}`,
            click: () => this.viewport.commands.delete(),
            // TODO add check that <main> can't be deleted
        };
        yield { type: 'separator' };
        yield {
            label: `Reset ${lbl}`,
            click: () => this.viewport.commands.reset(),
        };
    }

    showActionItemMenu() {
        const items = [...this.menuActionItem()];
        if (items.length) {
            this.app.ui.modalMenu.show(items);
        }
    }

    *menuActionItem(): IterableIterator<ModalMenuItem> {
        if (!this.viewport.isActionSelected()) {
            return;
        }
        const plural = this.viewport.getSelectedItems().length > 1;
        const lbl = plural ? 'actions' : 'action';
        yield {
            label: `Cut ${lbl}`,
            click: () => this.viewport.commands.cut(),
        };
        yield {
            label: `Copy ${lbl}`,
            click: () => this.viewport.commands.copy(),
        };
        yield {
            label: `Delete ${lbl}`,
            click: () => this.viewport.commands.delete(),
        };
        yield {
            label: `Change type...`,
            submenu: [...this.buildActionChangeType()],
        };
        yield {
            label: `Reset ${lbl}`,
            click: () => this.viewport.commands.reset(),
        };
        if (this.viewport.showBreakpointOptions()) {
            yield { type: 'separator' };
            yield {
                label: `Set breakpoint`,
                click: () => this.viewport.breakpoints.setBreakpoint(),
                enabled: this.viewport.showSetBreakpoint(),
            };
            yield {
                label: `Remove breakpoint`,
                click: () => this.viewport.breakpoints.removeBreakpoint(),
                enabled: this.viewport.showRemoveBreakpoint(),
            };
            yield {
                label: `Remove all breakpoints`,
                click: () => this.viewport.breakpoints.removeAllBreakpoints(),
                enabled: this.viewport.showRemoveAllBreakpoints(),
            };
        }
    }

    *menuEdit(): IterableIterator<MenuItemConstructorOptions> {
        yield {
            label: 'Create...',
            accelerator: 'CmdOrCtrl+Shift+A',
            click: () => this.showCreateMenu(),
            enabled: this.viewport.commands.canCreateAnything(),
        };
        if (!dom.isTextEditContext()) {
            yield {
                label: 'Cut selected',
                click: () => this.viewport.commands.cut(),
                accelerator: 'CmdOrCtrl+X',
                enabled: this.viewport.commands.canCut(),
            };
            yield {
                label: 'Copy selected',
                click: () => this.viewport.commands.copy(),
                accelerator: 'CmdOrCtrl+C',
                enabled: this.viewport.commands.canCopy(),
            };
            yield {
                label: 'Paste',
                click: () => this.viewport.commands.paste(),
                accelerator: 'CmdOrCtrl+V',
                enabled: this.viewport.commands.canPaste(),
            };
            yield {
                label: 'Delete selected',
                click: () => this.viewport.commands.delete(),
                accelerator: os.platform() === 'darwin' ? 'CmdOrCtrl+Backspace' : 'CmdOrCtrl+Delete',
                enabled: this.viewport.commands.canDelete(),
            };
        }
        yield { type: 'separator' };
        yield {
            label: 'Reset selected',
            click: () => this.viewport.commands.reset(),
            enabled: this.viewport.commands.canReset(),
        };
    }

    *menuView(): IterableIterator<MenuItemConstructorOptions> {
        yield {
            label: 'Search',
            accelerator: 'CmdOrCtrl+F',
            click: () => this.viewport.search.activate(),
        };
        yield {
            label: 'Next Result',
            accelerator: 'CmdOrCtrl+G',
            click: () => this.viewport.search.nextResult(),
        };
        yield {
            label: 'Previous Result',
            accelerator: 'CmdOrCtrl+Shift+G',
            click: () => this.viewport.search.previousResult(),
        };
    }

    *menuPlayback(): IterableIterator<MenuItemConstructorOptions> {
        // TODO
    }

    // Utilities

    private *buildActionCreate(list: ActionList): IterableIterator<ModalMenuItem> {
        if (list instanceof MatcherList) {
            yield { type: 'separator' };
            yield {
                label: 'Create Matcher',
                click: () => this.viewport.recorder.recordAction('matcher'),
            };
            return;
        }
        if (list instanceof DefinitionList) {
            yield { type: 'separator' };
            yield {
                label: 'Create Definition',
                click: () => this.viewport.recorder.recordAction('definition'),
            };
            return;
        }
        yield {
            label: 'Placeholder',
            click: () => this.viewport.recorder.recordAction('placeholder'),
            help: this.app.ui.help.getActionHelp('placeholder'),
        };
        yield {
            label: 'Precomposed action',
            submenu: [...this.buildCreateComposedAction()],
        };
        if (this.app.ui.frequentItems.isShown()) {
            yield* this.buildFrequentActions();
        }
        yield { type: 'header', label: 'All Actions' };
        yield* this.emitCategories(ActionClass => {
            return {
                label: ActionClass.$type,
                htmlLabel: this.createLabel(ActionClass),
                click: () => this.viewport.recorder.recordAction(ActionClass.$type),
                help: this.app.ui.help.getActionHelp(ActionClass.$type),
                deprecated: ActionClass.$deprecated,
            };
        });
    }

    private *buildFrequentActions(): IterableIterator<ModalMenuItem> {
        const frequentActionTypes = this.app.ui.frequentItems.getActionTypes();
        const frequentActions = frequentActionTypes
            .map(type => this.app.resolver.getActionClass(type))
            .filter(Boolean);
        if (frequentActions.length > 0) {
            yield { type: 'header', label: 'Frequent' };
            for (const ActionClass of frequentActions) {
                if (ActionClass.$hidden) {
                    continue;
                }
                yield {
                    label: ActionClass.$type,
                    htmlLabel: this.createLabel(ActionClass),
                    click: () => this.viewport.recorder.recordAction(ActionClass.$type),
                    help: this.app.ui.help.getActionHelp(ActionClass.$type),
                    deprecated: ActionClass.$deprecated,
                    searchable: false,
                };
            }
        }
    }

    private *buildActionChangeType(): IterableIterator<ModalMenuItem> {
        yield* this.emitCategories(ActionClass => {
            return {
                label: ActionClass.$type,
                htmlLabel: this.createLabel(ActionClass),
                click: () => this.viewport.commands.changeActionType({ type: ActionClass.$type }),
                enabled: this.viewport.commands.canChangeActionType(),
                help: this.app.ui.help.getActionHelp(ActionClass.$type),
                deprecated: ActionClass.$deprecated,
            };
        });
    }

    private *buildCreateComposedAction(): IterableIterator<ModalMenuItem> {
        const domain = this.app.protocol.getDomain();
        if (!domain) {
            return;
        }
        for (const input of domain.getInputs()) {
            const typeDef = input.getTypeDef();
            const spec = typeDef?.spec ?? {};
            if (spec.type === 'string') {
                yield {
                    label: input.key,
                    click: () => this.viewport.recorder.recordComposedAction(input.key, ''),
                };
            } else if (spec.type === 'object') {
                yield {
                    label: input.key,
                    submenu: [...this.buildComposedActionObjectSubmenu(domain, input, '', spec)],
                };
            }
        }
    }

    private *buildComposedActionObjectSubmenu(
        domain: Domain,
        input: InputDef,
        pathPrefix: string,
        objectSpec: any,
    ): IterableIterator<ModalMenuItem> {
        const properties = objectSpec.properties || {};
        for (const key of Object.keys(properties)) {
            const prop = properties[key];
            const path = pathPrefix + '/' + key;
            const spec = prop.$ref ? domain.protocol.resolveTypeRef(prop.$ref)!.spec : prop;
            if (spec.type === 'string') {
                yield {
                    label: key,
                    click: () => this.viewport.recorder.recordComposedAction(input.key, path),
                };
            } else if (spec.type === 'object') {
                yield {
                    label: key,
                    submenu: [...this.buildComposedActionObjectSubmenu(domain, input, path, spec)],
                };
            }
        }
    }

    /**
     * Builds action categories which lists standard ones at the top, then separator,
     * then the rest of them in alphabetical order.
     */
    private *emitCategories(itemFn: (actionClass: ActionClass) => ModalMenuItem): IterableIterator<ModalMenuItem> {
        const categories = this.app.resolver.getActionCategories().slice();
        for (const std of standardActionCategories) {
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
        category: model.Category<ActionClass>,
        itemFn: (actionClass: ActionClass) => ModalMenuItem,
    ): IterableIterator<ModalMenuItem> {
        const submenu = category.items
            .filter(_ => !_.$hidden)
            .map(ActionClass => itemFn(ActionClass));
        if (submenu.length) {
            yield {
                label: category.name,
                submenu,
            };
        }
    }

    private createLabel(actionClass: ActionClass) {
        const { ns, method } = actionClass.$metadata;
        return `<span class="subtle">${ns}.</span>${method}`;
    }

}
