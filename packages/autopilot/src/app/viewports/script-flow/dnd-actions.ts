import { EventEmitter } from 'events';
import { ScriptFlowViewport } from '.';
import { Action, ActionList } from '@automationcloud/engine';
import { clipboard } from '../../util';

export class DragAndDropActionsController extends EventEmitter {
    viewport: ScriptFlowViewport;

    pseudoEl: HTMLElement;
    dragging: boolean = false;
    actions: Action[] = [];

    constructor(viewport: ScriptFlowViewport) {
        super();
        this.viewport = viewport;
        this.pseudoEl = document.createElement('div');
        this.pseudoEl.setAttribute('class', 'dnd-pseudo');
        document.body.appendChild(this.pseudoEl);
    }

    createDragListeners() {
        return {
            dragstart: (ev: DragEvent) => this.onDragStart(ev),
            dragend: (ev: DragEvent) => this.onDragEnd(ev),
            dragenter: (ev: DragEvent) => this.onDragEnter(ev),
            dragleave: (ev: DragEvent) => this.onDragLeave(ev),
            dragover: (ev: DragEvent) => this.onDragOver(ev),
            drop: (ev: DragEvent) => this.onDrop(ev),
        };
    }

    createDropListeners() {
        return {
            dragenter: (ev: DragEvent) => this.onDragEnter(ev),
            dragleave: (ev: DragEvent) => this.onDragLeave(ev),
            dragover: (ev: DragEvent) => this.onDragOver(ev),
            drop: (ev: DragEvent) => this.onDrop(ev),
        };
    }

    onDragStart(ev: DragEvent) {
        const items = this.viewport.getSelectedItems();
        const list = this.viewport.getSelectedList();
        const el = ev.target as HTMLElement;
        const acceptable =
            items.length > 0 &&
            list instanceof ActionList &&
            items.some(i => i.id === el.getAttribute('data-selection-id'));
        if (!acceptable) {
            ev.preventDefault();
            return;
        }
        this.pseudoEl.innerText = `${items.length} action${items.length > 1 ? 's' : ''}`;
        ev.dataTransfer!.setDragImage(this.pseudoEl, 0, 16);
        ev.dataTransfer!.dropEffect = 'move';
        this.dragging = true;
        this.actions = items as Action[];
    }

    onDragEnd(_ev: Event) {
        this.dragging = false;
        this.actions = [];
    }

    onDragEnter(ev: Event) {
        const el = this.resolveEventTarget(ev);
        if (!el) {
            return;
        }
        const path = el.getAttribute('data-dnd-path') || '';
        if (!this.isValidDropTarget(path)) {
            return;
        }
        el.classList.add('dnd--over');
    }

    onDragLeave(ev: Event) {
        const el = this.resolveEventTarget(ev);
        if (!el) {
            return;
        }
        el.classList.remove('dnd--over');
    }

    onDragOver(ev: Event) {
        ev.preventDefault();
    }

    onDrop(ev: Event) {
        ev.preventDefault();
        ev.stopPropagation();
        this.onDragLeave(ev);
        const el = this.resolveEventTarget(ev);
        const path = el && el.getAttribute('data-dnd-path');
        if (!path || !this.isValidDropTarget(path)) {
            return;
        }
        const ref = this.viewport.script.get(path);
        if (ref instanceof ActionList) {
            this.moveToList(ref);
        } else if (ref instanceof Action) {
            this.moveAfterAction(ref);
        }
    }

    isValidDropTarget(path: string): boolean {
        if (!path || !this.dragging) {
            return false;
        }
        // Drop target is only valid if it's not inside any of the actions we're dragging
        return this.actions.every(a => !path.startsWith(a.$path));
    }

    resolveEventTarget(ev: Event): HTMLElement | null {
        return (ev.target as HTMLElement).closest('[data-dnd-path]') as HTMLElement;
    }

    moveToList(list: ActionList) {
        console.info('Move actions to list', this.actions, list);
        this.moveViaClipboard(list);
    }

    moveAfterAction(action: Action) {
        console.info('Move actions after action', this.actions, action);
        this.moveViaClipboard(action);
    }

    async moveViaClipboard(target: Action | ActionList) {
        // Tricky trick: we do this extremely complicated move operation
        // by reusing existing commands: Copy, Delete, Paste.
        // Since those use clipboard, we'll also save/restore the clipboard contents
        // so that nobody is upset
        const clipboardContents = clipboard.readText();
        clipboard.writeObject({
            type: 'actions',
            data: this.actions,
        });
        await this.viewport.commands.delete();
        if (target instanceof Action) {
            this.viewport.selectItem(target);
        } else {
            this.viewport.selectListHead(target);
        }
        await this.viewport.commands.paste();
        clipboard.writeText(clipboardContents);
    }
}
