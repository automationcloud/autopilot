import { EventEmitter } from 'events';
import { injectable } from 'inversify';

@injectable()
export class EventBus extends EventEmitter {
}
