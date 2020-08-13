import { App } from '../app';
import { Controller } from '../controller';

import { keyboard, dom } from '../util';

export class NavigationController implements Controller {
    app: App;

    focusTimer: any = null;

    constructor(app: App) {
        this.app = app;
    }

    async init() {}

    handleViewportNavigationKeydown(base: HTMLElement, ev: KeyboardEvent) {
        const focusEl = document.activeElement as HTMLElement;
        if (!focusEl || dom.isInputElement(focusEl)) {
            return;
        }
        keyboard.handle(ev, {
            'Space': () => focusEl.dispatchEvent(new CustomEvent('uiactivate')),
            'ArrowLeft': () => focusEl.dispatchEvent(new CustomEvent('uicollapse')),
            'ArrowRight': () => focusEl.dispatchEvent(new CustomEvent('uiexpand')),
            'ArrowDown': () => this.focusSibling({ base, next: true, event: 'uiselect' }),
            'Shift+ArrowDown': () => this.focusSibling({ base, next: true, event: 'uiselectexpand' }),
            'ArrowUp': () => this.focusSibling({ base, next: false, event: 'uiselect' }),
            'Shift+ArrowUp': () => this.focusSibling({ base, next: false, event: 'uiselectexpand' }),
            'CmdOrCtrl+Space': () => focusEl.dispatchEvent(new CustomEvent('uiselecttoggle')),
            'CmdOrCtrl+ArrowDown': () => this.focusSibling({ base, next: true }),
            'CmdOrCtrl+ArrowUp': () => this.focusSibling({ base, next: false }),
        });
    }

    focusSibling(spec: { base: HTMLElement; next: boolean; event?: string }) {
        const { base, next } = spec;
        const el = dom.getSelectableSibling({ base, next });
        if (!el) {
            return;
        }
        el.focus();
        if (spec.event) {
            el.dispatchEvent(new CustomEvent(spec.event));
        }
    }

    handleViewportNavigationClick(el: HTMLElement, ev: KeyboardEvent) {
        if (ev.shiftKey) {
            return el.dispatchEvent(new CustomEvent('uiselectexpand'));
        }
        if (ev.metaKey || ev.ctrlKey) {
            return el.dispatchEvent(new CustomEvent('uiselecttoggle'));
        }
        return el.dispatchEvent(new CustomEvent('uiselect'));
    }
}
