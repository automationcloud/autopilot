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

import { KeySpec, lookupKey } from './keyboard';
import { Page } from './page';
import { Point } from './types';

const MOD_SHIFT = 8;

/**
 * Manages CDP commands for sending input events to page.
 */
export class InputManager {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    getModifiers(mods: KeyModifiers): number {
        const { altKey, ctrlKey, metaKey, shiftKey } = mods;
        // tslint:disable no-bitwise
        return 0 | (altKey ? 1 : 0) | (ctrlKey ? 2 : 0) | (metaKey ? 4 : 0) | (shiftKey ? 8 : 0);
    }

    async click(point: Point, options: MouseOptions = {}) {
        const { delay = 0 } = options;
        await this.mouseDown(point, options);
        if (delay) {
            await new Promise(r => setTimeout(r, delay));
        }
        await this.mouseUp(point, options);
    }

    async mouseDown(point: Point, options: MouseOptions = {}) {
        const { modifiers = 0, button = 'left', clickCount = 1 } = options;
        const { x, y, zoom = 1 } = point;
        await this.page.send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            x: Math.round(x * zoom),
            y: Math.round(y * zoom),
            modifiers,
            button,
            clickCount,
        });
    }

    async mouseUp(point: Point, options: MouseOptions = {}) {
        const { modifiers = 0, button = 'left', clickCount = 1 } = options;
        const { x, y, zoom = 1 } = point;
        await this.page.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            x: Math.round(x * zoom),
            y: Math.round(y * zoom),
            modifiers,
            button,
            clickCount,
        });
    }

    async mouseMove(point: Point, options: MouseOptions = {}) {
        const { modifiers = 0, button } = options;
        const { x, y, zoom = 1 } = point;
        await this.page.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: Math.round(x * zoom),
            y: Math.round(y * zoom),
            modifiers,
            button,
        });
    }

    async print(text: string, options: PrintOptions = {}) {
        const { parallel = true } = options;
        if (parallel) {
            await this.printParallel(text);
        } else {
            for (const char of text) {
                await this.printSingleChar(char, options);
            }
        }
    }

    async printParallel(text: string) {
        const promises = [];
        for (const char of text) {
            const [key, modifiers] = this.charToKey(char);
            promises.push(this.keyDown(key, modifiers));
            promises.push(this.keyUp(key, modifiers));
        }
        await Promise.all(promises);
    }

    async printSingleChar(char: string, options: PrintOptions = {}) {
        const { delay = 0 } = options;
        const [key, modifiers] = this.charToKey(char);
        await this.keyDown(key, modifiers);
        if (delay) {
            await new Promise(r => setTimeout(r, delay));
        }
        await this.keyUp(key, modifiers);
    }

    async keyDown(key: KeySpec, modifiers: number = 0) {
        await this.page.send('Input.dispatchKeyEvent', {
            type: 'keyDown',
            modifiers,
            text: key.text,
            key: key.key,
            code: key.code,
            windowsVirtualKeyCode: key.keyCode,
        });
    }

    async keyUp(key: KeySpec, modifiers: number = 0) {
        await this.page.send('Input.dispatchKeyEvent', {
            type: 'keyUp',
            modifiers,
            key: key.key,
            code: key.code,
            windowsVirtualKeyCode: key.keyCode,
        });
    }

    protected charToKey(char: string): [KeySpec, number] {
        const isLetter = char.toLowerCase() !== char.toUpperCase();
        const isUpperCase = isLetter && char === char.toUpperCase();
        const modifiers = isUpperCase ? MOD_SHIFT : 0;
        const key = lookupKey(char);
        return [key, modifiers];
    }
}

export interface MouseOptions {
    button?: string;
    modifiers?: number;
    clickCount?: number;
    delay?: number;
}

export interface PrintOptions {
    parallel?: boolean;
    delay?: number;
}

export interface KeyModifiers {
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
}
