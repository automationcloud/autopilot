import { BrowserService } from './browser';
import { inject, injectable } from 'inversify';
import { Page, CdpRequestWillBeSent, Logger } from '@automationcloud/cdp';
import { SessionHandler } from '../session';

@injectable()
@SessionHandler()
export class StatsService {
    visitedOrigins: string[] = [];
    httpRequestsCount: number = 0;
    scriptRunTime: StatCounter = new StatCounter();
    contextMatchTime: StatCounter = new StatCounter();
    actionRunTime: StatCounter = new StatCounter();
    actionPerTypeTime: { [type: string]: StatCounter } = {
        click: new StatCounter(),
        input: new StatCounter(),
        sleep: new StatCounter(),
        javascript: new StatCounter(),
    };

    constructor(
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(Logger)
        protected logger: Logger,
    ) {
        for (const page of browser.attachedPages()) {
            this.monitorPage(page);
        }
        browser.on('pageCreated', (page: Page) => this.monitorPage(page));
    }

    async onSessionStart() {
        this.clean();
    }

    async onSessionFinish() {
        this.clean();
    }

    clean() {
        this.visitedOrigins = [];
        this.httpRequestsCount = 0;
        this.scriptRunTime.clear();
        this.contextMatchTime.clear();
        this.actionRunTime.clear();
        for (const [_key, counter] of Object.entries(this.actionPerTypeTime)) {
            counter.clear();
        }
    }

    protected monitorPage(page: Page) {
        page.target.on('Network.requestWillBeSent', ev => this.onRequestWillBeSent(page, ev));
    }

    protected onRequestWillBeSent(page: Page, ev: CdpRequestWillBeSent) {
        this.httpRequestsCount++;
        try {
            const url = new URL(ev.request.url);
            // data urls don't have origin, so URL will contain "null" (string)
            if (!url.host) {
                return;
            }
            if (!this.visitedOrigins.includes(url.origin)) {
                this.visitedOrigins.push(url.origin);
            }
        } catch (error) {
            this.logger.info('[statsService] Failed to log visited origin', { error });
        }
    }

    incrActionRunTime(actionType: string, duration: number) {
        this.actionRunTime.incr(duration);
    }
}

export class StatCounter {
    n: number = 0;
    sum: number = 0;
    sumSq: number = 0;
    min: number = +Infinity;
    max: number = -Infinity;
    last: number = 0;

    clear() {
        this.n = 0;
        this.sum = 0;
        this.sumSq = 0;
        this.min = +Infinity;
        this.max = -Infinity;
        this.last = 0;
    }

    incr(val: number): void {
        this.n += 1;
        this.sum += val;
        this.sumSq += val * val;
        this.min = Math.min(this.min, val);
        this.max = Math.max(this.max, val);
        this.last = val;
    }

    avg(): number {
        return this.sum / this.n;
    }

    stdev(): number {
        const { sum, sumSq, n } = this;
        return Math.sqrt(n * sumSq - sum * sum) / n;
    }
}
