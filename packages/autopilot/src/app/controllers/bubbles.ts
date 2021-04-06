import { injectable } from 'inversify';

import { controller } from '../controller';
import { Bubble } from '../entities/bubble';

@injectable()
@controller({ alias: 'bubbles' })
export class BubblesController {
    queue: Bubble[] = [];
    countForSession: number = 0;

    async init() {}

    get currentBubble() {
        return this.queue[0] ?? null;
    }

    addMany(bubbles: Bubble[]) {
        this.queue.push(...bubbles);
        this.countForSession += bubbles.length;
    }

    remove(id: string) {
        const bubble = this.queue.find(_ => _.id === id);
        if (!bubble) {
            return;
        }

        if (bubble.onRemove) {
            bubble.onRemove();
        }
        this.queue = this.queue.filter(_ => _.id !== bubble.id);
        // all flushed down
        if (this.queue.length === 0) {
            this.countForSession = 0;
        }
    }

    removeAll() {
        for (const bubble of [...this.queue]) {
            this.remove(bubble.id);
        }
    }

}
