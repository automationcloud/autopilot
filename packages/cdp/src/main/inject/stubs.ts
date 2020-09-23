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

/* eslint-disable prefer-rest-params */
/* eslint-disable no-console */

export function stubs() {
    let hostEl: HTMLElement | null = null;
    installStubs();

    function installStubs() {
        // Drop onbeforeunload hooks
        const oldAddEventListener: any = Window.prototype.addEventListener;

        Window.prototype.addEventListener = function addEventListener(event: string) {
            if (event === 'beforeunload' || event === 'unload') {
                logMessage('Dropped beforeunload (via window.addEventListener)');
                return;
            }
            oldAddEventListener.apply(this, arguments);
        };

        const oldAddEventListenerBody: any = HTMLBodyElement.prototype.addEventListener;

        HTMLBodyElement.prototype.addEventListener = function addEventListener(event: string) {
            if (event === 'beforeunload' || event === 'unload') {
                logMessage('Dropped beforeonload (via body.addEventListener)');
                return;
            }
            oldAddEventListenerBody.apply(this, arguments);
        };

        Object.defineProperty(HTMLBodyElement.prototype, 'onbeforeunload', {
            get() {
                return null;
            },
            set() {
                logMessage('Dropped beforeunload (via body.onbeforeunload)');
            },
        });

        removeUnloadEvents(window);

        document.addEventListener('DOMContentLoaded', () => {
            removeUnloadEvents(document.body);
        });

        // Stub alert, confirm and prompt

        Object.assign(window, {
            __alert: window.alert,
            __confirm: window.confirm,
            __prompt: window.prompt,
        });
        window.alert = alertStub;
        window.confirm = confirmStub;
        window.prompt = promptStub;
    }

    function alertStub(message: string) {
        const root = getHostEl();
        const existing = root.querySelectorAll('[data-ubio-alert]');
        for (const el of existing) {
            el.parentNode!.removeChild(el);
        }

        const el = document.createElement('div');
        root.appendChild(el);
        el.setAttribute('class', 'ubio ubio-alert');
        el.setAttribute('data-ubio', '');
        el.setAttribute('data-ubio-alert', '');
        el.setAttribute(
            'style',
            `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 16px;
            background: gold;
        `,
        );
        el.innerText = message;
        el.addEventListener('dblclick', () => el.parentNode!.removeChild(el));
    }

    function confirmStub() {
        logMessage('Suppressed confirm, returning true');
        return true;
    }

    function promptStub(title?: string, value?: string) {
        logMessage('Suppressed prompt, returning default value');
        return value || null;
    }

    function logMessage(message: string) {
        console.log('✈︎✈︎✈︎ ' + message);
    }

    function removeUnloadEvents(el: any) {
        el.onbeforeunload = null;
        el.onunload = null;
        Object.defineProperty(el, 'onbeforeunload', {
            get() {
                return null;
            },
            set() {
                logMessage(`Dropped beforeunload (via <${el.tagName} onbeforeunload="">)`);
            },
        });
        try {
            Object.defineProperty(el, 'onunload', {
                get() {
                    return null;
                },
                set() {
                    logMessage(`Dropped beforeunload (via <${el.tagName} onunload="">)`);
                },
            });
        } catch (e) {}
        try {
            el.setAttribute('onbeforeunload', '');
            el.setAttribute('onunload', '');
        } catch (e) {}
    }

    function getHostEl() {
        if (!hostEl) {
            hostEl = document.createElement('div');
            document.documentElement.appendChild(hostEl);
            hostEl.style.zIndex = '9999999';
            hostEl.style.position = 'fixed';
            hostEl.style.top = '0';
            hostEl.style.left = '0';
        }
        return hostEl;
    }
}
