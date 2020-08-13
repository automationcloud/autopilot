import { Target } from '@automationcloud/engine';
import { App } from '../app';
import { Controller } from '../controller';

export class FeedbackController implements Controller {
    app: App;
    targetsWatched: Set<string> = new Set();

    constructor(app: App) {
        this.app = app;
    }

    async init() {
        const { browser } = this.app;
        browser.on('pageCreated', page => this.watchTarget(page.target));
        browser.on('targetDetached', target => this.unwatchTarget(target));
        browser.on('attached', () => this.invalidate());
        browser.on('willDetach', () => this.invalidate());
        if (browser.isAttached()) {
            this.watchTarget(browser.page.target);
        }
        // TODO also invalidate on action/context reset
    }

    invalidate() {
        this.app.events.emit('feedbackInvalidated');
    }

    watchTarget(target: Target) {
        if (this.targetsWatched.has(target.targetId)) {
            return;
        }
        target.addListener('cdp.DOM', () => this.invalidate());
        target.addListener('cdp.Network', () => this.invalidate());
        this.invalidate();
    }

    unwatchTarget(target: Target) {
        this.targetsWatched.delete(target.targetId);
    }
}
