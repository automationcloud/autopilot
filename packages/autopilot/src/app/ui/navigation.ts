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

import { App } from '../app';
import { Controller } from '../controller';
import { dom, keyboard } from '../util';

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
            Space: () => focusEl.dispatchEvent(new CustomEvent('uiactivate')),
            ArrowLeft: () => focusEl.dispatchEvent(new CustomEvent('uicollapse')),
            ArrowRight: () => focusEl.dispatchEvent(new CustomEvent('uiexpand')),
            ArrowDown: () => this.focusSibling({ base, next: true, event: 'uiselect' }),
            'Shift+ArrowDown': () => this.focusSibling({ base, next: true, event: 'uiselectexpand' }),
            ArrowUp: () => this.focusSibling({ base, next: false, event: 'uiselect' }),
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
