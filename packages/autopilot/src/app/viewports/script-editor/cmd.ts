import { ScriptEditorViewport } from '.';
import { Command } from '../../command';

export abstract class ScriptEditorCommand extends Command<ScriptEditorViewport> {
    getConnectedViewports() {
        return [this.app.viewports.scriptEditor, this.app.viewports.scriptFlow];
    }
}

interface EntityLike {
    id: string;
    $path: string;
    [key: string]: any;
}

export abstract class EditEntityCommand<T extends EntityLike> extends ScriptEditorCommand {
    path: string;
    key: string;
    oldValue: any = null;
    newValue: any = null;

    constructor(viewport: ScriptEditorViewport, path: string, key: string, value: any) {
        super(viewport);
        this.path = path;
        this.key = key;
        this.newValue = value;
    }

    abstract validateEntity(entity: T): boolean;

    getEntity(): T | null {
        const entity = this.script.get(this.path);
        return entity && this.validateEntity(entity) ? entity : null;
    }

    isUndoable() {
        return true;
    }

    canExecute() {
        return this.getEntity() != null;
    }

    append(cmd: EditEntityCommand<T>): boolean {
        if (cmd.path === this.path && cmd.key === this.key) {
            this.oldValue = cmd.oldValue;
            return true;
        }
        return false;
    }

    protected async apply() {
        const { key, newValue } = this;
        const entity = this.getEntity()!;
        this.oldValue = entity[key];
        (entity as any)[key] = newValue;
        if (this.shouldExpand()) {
            this.app.expandable.expand(entity.id);
        }
        this.app.project.update();
    }

    protected async unapply() {
        const entity = this.getEntity()!;
        if (!entity) {
            return this.throw('Cannot undo: illegal command state');
        }
        const { key, oldValue } = this;
        (entity as any)[key] = oldValue;
        if (this.shouldExpand()) {
            this.app.expandable.expand(entity.id);
        }
        this.app.project.update();
    }
}
