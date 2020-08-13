import { App } from '../app';
import { Controller } from '../controller';
import { fuzzySearch } from '@automationcloud/fuzzy-search';

export interface ModalMenuItem {
    label?: string;
    htmlLabel?: string;
    click?: () => void;
    type?: string;
    enabled?: boolean;
    checked?: boolean;
    searchable?: boolean;
    deprecated?: string;
    help?: string;
    submenu?: ModalMenuItem[];
}

export interface ModalMenuSearchResult extends ModalMenuItem {
    score: number;
    highlight: string;
}

export class ModalMenuController implements Controller {
    app: App;

    shown: boolean = false;
    items: ModalMenuItem[] = [];
    breadcrumbs: string[] = [];
    search: string = '';
    searchResults: ModalMenuSearchResult[] = [];

    constructor(app: App) {
        this.app = app;
    }

    async init() {}

    reset() {
        this.shown = false;
        this.items = [];
        this.breadcrumbs = [];
        this.search = '';
        this.searchResults = [];
    }

    show(items: ModalMenuItem[]) {
        this.reset();
        if (items.length) {
            this.shown = true;
            this.items = items;
        }
    }

    showItems(items: IterableIterator<ModalMenuItem>) {
        this.show([...items]);
    }

    hide() {
        this.reset();
        this.app.viewports.focusActive();
    }

    getDisplayedItems(): ModalMenuItem[] {
        const search = this.search.trim();
        return search ? this.searchResults : this.getCurrentLevelItems();
    }

    isItemFocusable(item: ModalMenuItem) {
        return item.type !== 'separator' && item.enabled !== false;
    }

    clickItem(item: ModalMenuItem) {
        if (item.type === 'separator') {
            return;
        }
        if (item.enabled === false) {
            return;
        }
        if (item.submenu) {
            this.breadcrumbs.push(item.label || '');
            return;
        }
        if (item.click) {
            item.click();
        }
        this.hide();
    }

    clearBreadcrumbs() {
        this.breadcrumbs = [];
    }

    clickBreadcrumbs(label: string) {
        const i = this.breadcrumbs.indexOf(label);
        this.breadcrumbs = this.breadcrumbs.slice(0, i + 1);
    }

    goBack() {
        if (this.breadcrumbs.length) {
            this.breadcrumbs = this.breadcrumbs.slice(0, this.breadcrumbs.length - 1);
        }
    }

    performSearch(search: string) {
        this.search = search.trim().toLowerCase();
        const candidates = this.getSearchCandidates(this.items);
        const sources = candidates.map(c => c.label || '').filter(Boolean);
        const results = fuzzySearch(this.search, sources);
        this.searchResults = results.map(res => {
            const item = candidates[res.sourceIndex];
            const source = sources[res.sourceIndex];
            const highlight = source.split('').map((char, i) => {
                return res.matches.includes(i) ? `<b>${char}</b>` : char;
            }).join('');
            return {
                ...item,
                score: res.score,
                highlight,
            };
        });
        this.breadcrumbs = [];
    }

    protected getCurrentLevelItems(): ModalMenuItem[] {
        let items = this.items;
        for (const label of this.breadcrumbs) {
            const item = items.find(_ => _.label === label);
            items = item ? item.submenu || [] : [];
        }
        return items;
    }

    protected getSearchCandidates(items: ModalMenuItem[]): ModalMenuItem[] {
        const results: ModalMenuItem[] = [];
        for (const item of items) {
            if (item.submenu) {
                results.push(...this.getSearchCandidates(item.submenu));
            } else if (this.isItemSearchable(item)) {
                results.push(item);
            }
        }
        return results;
    }

    protected isItemSearchable(item: ModalMenuItem) {
        return Boolean(item.label &&
            item.enabled !== false &&
            item.searchable !== false &&
            item.type !== 'header');
    }
}
