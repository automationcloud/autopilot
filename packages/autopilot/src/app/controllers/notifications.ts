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
        this.current = this.current.filter(_ => !this.matchById(_, id));
    }

    removeClosable() {
        this.current = this.current.filter(_ => !_.canClose);
    }

    protected create(spec: Partial<Notification>): Notification {
        const level = spec.level ?? 'info';
        const icon = level === 'info' ? 'fas fa-info-circle' :
            level === 'warn' ? 'fas fa-exclamation-circle' :
                'fas fa-meh';
        return {
            id: util.shortId(),
            title: '',
            message: '',
            icon,
            level,
            style: 'float',
            canClose: true,
            timeout: 0,
            ...spec,
        };
    }

    protected matchById(notification: Notification, id: string) {
        const pattern = new RegExp('^' + id.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        return pattern.test(notification.id);
    }

}
