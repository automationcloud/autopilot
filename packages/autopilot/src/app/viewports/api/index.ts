import { Viewport } from '../../viewport';
import { ApiService, ApiScript } from '../../controllers/api';
import { App } from '../../app';
import { ServicesController, ServiceFilters } from './services';
import { ScriptsController } from './scripts';
import { ScriptDiffController } from '../../controllers/script-diff';
import { EventBus } from '../../event-bus';

export interface ApiViewportState {
    filters: ServiceFilters;
}

export class ApiViewport extends Viewport<ApiViewportState> {
    services: ServicesController;
    scripts: ScriptsController;

    selectedService: ApiService | null = null;
    error: any | null = null;

    loadedScript: ApiScript | null = null;
    loadedService: ApiService | null = null;
    loadedServiceActiveScript: ApiScript | null = null;

    constructor(app: App) {
        super(app);
        this.services = new ServicesController(this);
        this.scripts = new ScriptsController(this);
    }

    get diff() { return this.app.get(ScriptDiffController); }
    get events() { return this.app.get(EventBus); }

    async init() {
        await super.init();
        const state = this.getState();
        this.services.applyFilters(state.filters, false);
        this.events.on('acApiAuthorised', authorised => {
            if (this.error && authorised) {
                this.dismissError();
            }
        });
    }

    getViewportId(): string {
        return 'api';
    }

    getViewportName(): string {
        return 'API';
    }

    getViewportIcon(): string {
        return 'fas fa-code';
    }

    getDefaultState(): ApiViewportState {
        return { filters: { name: '', domainId: null, archived: false } };
    }

    dismissError() {
        this.error = null;
    }

    goToServices() {
        this.selectedService = null;
    }

    selectService(service: ApiService) {
        this.selectedService = service;
    }

    getChangesCount() {
        let res = 0;
        for (const action of this.app.project.script.allActions()) {
            if (this.diff.getObjectStatus(action) !== 'up-to-date') {
                res += 1;
            }
        }
        return res;
    }

    async refresh() {
        try {
            this.loadedService = null;
            this.loadedScript = null;
            this.loadedServiceActiveScript = null;
            const { scriptId, serviceId } = this.app.project.metadata;
            if (this.selectedService) {
                this.selectedService = await this.app.api.getService(this.selectedService.id);
            }
            if (scriptId) {
                this.loadedScript = await this.app.api.getScript(scriptId);
            }
            if (serviceId) {
                this.loadedService = await this.app.api.getService(serviceId);
                if (this.loadedService.scriptId) {
                    this.loadedServiceActiveScript = await this.app.api.getScript(this.loadedService.scriptId);
                }
            }
        } catch (err) {
            this.error = err;
        }
    }
}
