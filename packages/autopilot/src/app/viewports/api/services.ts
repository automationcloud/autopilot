import { ApiViewport } from '.';
import { ApiService } from '../../controllers/api';
import throttle from 'promise-smart-throttle';
import { helpers } from '../../util';

export interface ServiceFilters {
    name: string | null;
    domainId: string | null;
    archived: boolean | null;
}

export class ServicesController {
    viewport: ApiViewport;

    _filters: ServiceFilters = {
        name: null,
        domainId: null,
        archived: false,
    };
    filters: ServiceFilters;
    loading: boolean = false;
    hasMore: boolean = false;
    services: ApiService[] = [];

    constructor(viewport: ApiViewport) {
        this.viewport = viewport;

        const oldRefresh = this.refresh;
        this.refresh = throttle(() => oldRefresh.apply(this), 200);
        this.filters = helpers.createEditProxy(this._filters, (k, v) => {
            this.applyFilters({ [k]: v }, true);
        });
    }

    get api() {
        return this.viewport.app.api;
    }
    get datasets() {
        return this.viewport.app.datasets;
    }

    async refresh() {
        this.hasMore = false;
        this.services = [];
        await this.loadMore();
    }

    async loadMore() {
        try {
            this.loading = true;
            const services = await this.api.getServices({
                name: this.filters.name,
                domainId: this.filters.domainId,
                archived: this.filters.archived,
                limit: 101,
                offset: this.services.length,
            });
            this.hasMore = services.length > 100;
            this.services.push(...services.slice(0, 100));
        } catch (err) {
            this.viewport.error = err;
        } finally {
            this.loading = false;
        }
    }

    getInputFields() {
        const results: Set<string> = new Set();

        function flatten(prop: string, field: any): void {
            if (Object(field) !== field) {
                return void results.add(prop);
            }

            if (Array.isArray(field)) {
                return field.forEach(obj => flatten(prop, obj));
            }

            for (const [key, nested] of Object.entries(field)) {
                flatten(`${prop}.${key}`, nested);
            }
        }

        for (const { key, data } of this.datasets.getCurrentDataset().inputs) {
            flatten(key, data);
        }

        return Array.from(results).sort();
    }

    async updateAttributes(serviceId: string, attributes: object) {
        await this.api.updateServiceAttributes(serviceId, attributes);
    }

    clearFilters() {
        this.applyFilters({
            name: null,
            domainId: null,
            archived: false,
        });
    }

    async applyFilters(mods: any, persist: boolean = true) {
        Object.assign(this._filters, mods);
        this.refresh();
        if (persist) {
            this.viewport.applyState({ filters: this._filters });
        }
    }
}
