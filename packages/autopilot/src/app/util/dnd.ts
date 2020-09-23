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

import { EventEmitter } from 'events';

export class DragAndDrop extends EventEmitter {
    className: string;
    container: HTMLElement | null;
    handleClassName: string | null;
    dragIndex: number = -1;

    constructor(spec: { className: string; handleClassName?: string; container?: HTMLElement }) {
        super();
        this.className = spec.className;
        this.handleClassName = spec.handleClassName || null;
        this.container = spec.container || null;
    }

    getElementIndex(el: HTMLElement): number {
        return Number(el.getAttribute('data-index'));
    }

    isDragging(): boolean {
        return this.dragIndex > -1;
    }

    createListeners() {
        return {
            dragstart: (ev: Event) => this.onDragStart(ev),
            dragend: (ev: Event) => this.onDragEnd(ev),
            dragenter: (ev: Event) => this.onDragEnter(ev),
            dragleave: (ev: Event) => this.onDragLeave(ev),
            dragover: (ev: Event) => this.onDragOver(ev),
            drop: (ev: Event) => this.onDrop(ev),
        };
    }

    onDragStart(ev: Event) {
        const el = this.resolveEventTarget(ev);
        if (!el) {
            return;
        }
        const index = this.getElementIndex(el);
        this.dragIndex = index;
    }

    onDragEnd(_ev: Event) {
        this.dragIndex = -1;
    }

    onDragEnter(ev: Event) {
        const el = this.resolveEventTarget(ev);
        if (!el) {
            return;
        }
        const index = this.getElementIndex(el);
        if (index > this.dragIndex) {
            el.classList.add(this.className + '--dnd--over');
            el.classList.add(this.className + '--dnd--after');
        } else if (index < this.dragIndex) {
            el.classList.add(this.className + '--dnd--over');
            el.classList.add(this.className + '--dnd--before');
        }
    }

    onDragLeave(ev: Event) {
        const el = this.resolveEventTarget(ev);
        if (!el) {
            return;
        }
        const index = this.getElementIndex(el);
        if (index > this.dragIndex) {
            el.classList.remove(this.className + '--dnd--over');
            el.classList.remove(this.className + '--dnd--after');
        } else if (index < this.dragIndex) {
            el.classList.remove(this.className + '--dnd--over');
            el.classList.remove(this.className + '--dnd--before');
        }
    }

    onDragOver(ev: Event) {
        ev.preventDefault();
    }

    onDrop(ev: Event) {
        ev.preventDefault();
        ev.stopPropagation();
        this.onDragLeave(ev);
        const el = this.resolveEventTarget(ev);
        if (!el) {
            return;
        }
        const srcIdx = this.dragIndex;
        const dstIdx = this.getElementIndex(el);
        if (dstIdx > -1 && srcIdx > -1 && srcIdx !== dstIdx) {
            this.emit('dnd', srcIdx, dstIdx);
        }
    }

    resolveEventTarget(ev: Event): HTMLElement | null {
        const el = ev.target as HTMLElement;
        if (this.container && !this.container.contains(el)) {
            return null;
        }
        return el.closest('.' + this.className) as HTMLElement;
    }
}
