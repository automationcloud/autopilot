import { EventEmitter } from 'events';
import { injectable } from 'inversify'
import { ipcRenderer } from 'electron';

@injectable()
export class EventBus extends EventEmitter {
    constructor() {
        super();
        ipcRenderer.on('loginResult', (_ev, code: string) => this.emit('loginResult', code));
    }

}
