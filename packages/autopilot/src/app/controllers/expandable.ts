import { controller } from '../controller';
import { UserData } from '../userdata';
import { injectable, inject } from 'inversify';
import { StorageController } from './storage';

@injectable()
@controller({ backgroundInit: true })
export class ExpandableController {
    userData: UserData;

    expandedIds: string[] = [];
    expandedSet: Set<string> = new Set();

    constructor(
        @inject(StorageController)
        protected storage: StorageController,
    ) {
        this.userData = storage.createUserData('expandable', 500);
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
