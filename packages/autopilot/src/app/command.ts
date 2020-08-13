import { Viewport } from './viewport';
import { Script } from '@automationcloud/engine';

export interface CommandFactory<V extends Viewport<any>> {
    title: string;
    new (viewport: V, ...args: any[]): Command<V>;
}

export abstract class Command<V extends Viewport<any>> {
    viewport: V;
    connectedViewportsState: Map<string, any> = new Map();
    lastExecutedAt: number = 0;

    constructor(viewport: V) {
        this.viewport = viewport;
    }

    get app() {
        return this.viewport.app;
    }

    get script(): Script {
        return this.app.project.script;
    }

    get title(): string {
        return (this.constructor as CommandFactory<V>).title;
    }

    abstract isUndoable(): boolean;
    abstract canExecute(): boolean;
    protected abstract async apply(): Promise<void>;
    protected abstract async unapply(): Promise<void>;

    protected getConnectedViewports(): Array<Viewport<any>> {
        return [this.viewport];
    }

    append(_cmd: Command<V>): boolean {
        return false;
    }

    async execute() {
        if (!this.canExecute()) {
            return;
        }
        this.saveConnectedState();
        this.viewport.activateViewport();
        await this.apply();
        this.lastExecutedAt = Date.now();
        if (this.isUndoable()) {
            this.viewport.getCommandBuffer().registerNewCommand(this);
        }
        this.app.events.emit('commandExecuted', this);
    }

    async executeUndo() {
        this.viewport.activateViewport();
        this.restoreConnectedState();
        await this.unapply();
        this.viewport.focus();
    }

    async executeRedo() {
        this.saveConnectedState();
        this.viewport.activateViewport();
        await this.apply();
        this.viewport.focus();
    }

    async saveConnectedState() {
        this.connectedViewportsState = new Map();
        for (const viewport of this.getConnectedViewports()) {
            this.connectedViewportsState.set(viewport.getViewportId(), viewport.getState());
        }
    }

    async restoreConnectedState() {
        for (const viewport of this.getConnectedViewports()) {
            const state = this.connectedViewportsState.get(viewport.getViewportId());
            viewport.applyState(state);
        }
    }

    protected throw(message: string, details: any = {}) {
        const err = new Error(message) as any;
        err.command = this;
        err.details = details;
        throw err;
    }

    protected shouldExpand() {
        return true;
    }
}
