import { App } from '../app';
import { Controller } from '../controller';
import { UserData } from '../userdata';

export class ExpandableController implements Controller {
    app: App;
    userData: UserData;

    expandedIds: string[] = [];
    expandedSet: Set<string> = new Set();

    constructor(app: App) {
        this.app = app;
        this.userData = app.storage.createUserData('expandable', 500);
    }

    async init() {
        const { expandedIds = [] } = await this.userData.loadData();
        this.expandedIds = expandedIds;
        this.expandedSet = new Set(expandedIds);
    }

    update() {
        this.expandedIds = [...this.expandedSet];
        this.userData.update({
            expandedIds: this.expandedIds,
        });
    }

    isExpanded(id: string) {
        return this.expandedIds && this.expandedSet.has(id);
    }

    expand(id: string) {
        this.expandedSet.add(id);
        this.update();
    }

    collapse(id: string) {
        this.expandedSet.delete(id);
        this.update();
    }

    toggleExpand(id: string) {
        if (this.isExpanded(id)) {
            this.collapse(id);
        } else {
            this.expand(id);
        }
    }

    collapseAll() {
        this.expandedSet.clear();
        this.update();
    }
}
