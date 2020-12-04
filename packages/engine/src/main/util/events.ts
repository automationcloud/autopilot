import { EventEmitter } from 'events';

export type EventHandler = () => void;

export function createEventHandler(
    emitter: EventEmitter,
    event: string,
    fn: (...args: any[]) => void | Promise<void>
): EventHandler {
    const handler = (...args: any[]) => fn(...args);
    emitter.addListener(event as any, handler);
    return () => emitter.removeListener(event, handler);
}
