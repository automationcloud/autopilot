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
