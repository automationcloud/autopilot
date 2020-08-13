import { Controller } from '../controller';
import { App } from '../app';

export class ObjectsController implements Controller {
    constructor(public app: App) {}

    async init() {}

    getActionIcon(type: string) {
        const ActionClass = this.app.resolver.getActionClass(type);
        return ActionClass.$icon || 'far fa-circle';
    }
}
