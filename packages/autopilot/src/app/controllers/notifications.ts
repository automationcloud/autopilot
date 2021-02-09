import { util } from '@automationcloud/engine';
import { injectable } from 'inversify';
import { controller } from '../controller';
import { Notification } from '../entities/notification';

@injectable()
@controller({
    alias: 'notifications'
})
export class NotificationsController {
    current: Notification[] = [];

    constructor() {
        window.addEventListener('keyup', ev => {
            if (ev.key === 'Escape') {
                this.removeClosable();
            }
        });
    }

    async init() {}

    add(spec: Partial<Notification>): Notification {
        const nn = this.create(spec);
        this.current.push(nn);
        if (nn.timeout > 0) {
            setTimeout(() => this.removeById(nn.id), nn.timeout);
        }
        return nn;
    }

    removeById(id: string) {
        this.current = this.current.filter(_ => _.id !== id);
    }

    removeByKind(kind: string) {
        this.current = this.current.filter(_ => _.kind === kind);
    }

    removeClosable() {
        this.current = this.current.filter(_ => !_.canClose);
    }

    protected create(spec: Partial<Notification>): Notification {
        return {
            id: util.shortId(),
            kind: '',
            title: '',
            message: '',
            icon: 'fas fa-info-circle',
            level: 'info',
            style: 'float',
            canClose: true,
            timeout: 0,
            ...spec,
        };
    }

}
