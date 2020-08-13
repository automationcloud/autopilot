import { App } from '../app';
import { Element, ActionList } from '@automationcloud/engine';
import debounce from 'debounce-promise';

export class Feedback {
    actionList: ActionList | null = null;
    refreshing: boolean = true;
    inputSet: Element[] = [];
    error: any | null = null;

    listener: () => Promise<void>;

    constructor(
        protected app: App,
    ) {
        this.refresh = debounce(this.refresh, 300, { leading: true });
        this.listener = () => this.refresh();
        app.events.addListener('feedbackInvalidated', this.listener);
    }

    destroy() {
        this.app.events.removeListener('feedbackInvalidated', this.listener);
    }

    set(actionList: ActionList | null) {
        this.actionList = actionList;
        this.refresh();
    }

    async refresh() {
        if (!this.actionList) {
            return;
        }
        if (!this.app.browser.isAttached()) {
            return;
        }
        this.refreshing = true;
        try {
            this.error = null;
            this.inputSet = await this.actionList.resolveScope();
        } catch (err) {
            this.error = err;
            this.inputSet = [];
        } finally {
            this.refreshing = false;
        }
    }

}
