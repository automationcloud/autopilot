import { ipcRenderer } from 'electron';
import { AppUiControllers, createUiControllers } from './ui';
import { Controller, controllers } from './controller';
import {
    Engine,
    Logger,
    ConsoleLogger,
    Configuration,
    BrowserService,
    CheckpointService,
    FlowService,
    ReporterService,
    ProxyService,
    ResolverService,
} from '@automationcloud/engine';

import { InspectManager } from './managers/inspect-manager';
import { LayoutManager } from './managers/layout-manager';
import { PlaybackManager } from './managers/playback-manager';
import { RecipeManager } from './managers/recipe-manager';
import { ViewportManager } from './managers/viewport-manager';
import { StorageController } from './controllers/storage';
import { AutopilotBrowserService } from './overrides/browser';
import { AutopilotCheckpointService } from './overrides/checkpoint';
import { AutopilotConfiguration } from './overrides/config';
import { AutopilotFlowService } from './overrides/flow';
import { AutopilotReporterService } from './overrides/reporter';
import { EventBus } from './event-bus';
import * as ct from './controllers';
import { ToolsController } from './controllers/tools';
import ms from 'ms';

export class App extends Engine {
    // Deprecated
    inspector: InspectManager;
    layout: LayoutManager;
    playback: PlaybackManager;
    recipes: RecipeManager;
    viewports: ViewportManager;

    ui: AppUiControllers;
    uiControllers: Controller[];

    initialized: boolean = false;
    profileCount: number = 0;

    constructor() {
        super();

        // App globals
        this.container.bind('App').toConstantValue(this); // for compat
        this.container.bind(EventBus).toSelf().inSingletonScope();

        // Controllers are always singletons identified by their class
        for (const ctrl of controllers) {
            this.container.bind(ctrl.class).toSelf().inSingletonScope();
        }

        // Engine overrides
        this.container.rebind(Logger).to(ConsoleLogger).inSingletonScope();
        this.container.rebind(BrowserService).toService(AutopilotBrowserService);
        this.container.rebind(CheckpointService).to(AutopilotCheckpointService).inSingletonScope();
        this.container.rebind(Configuration).to(AutopilotConfiguration).inSingletonScope();
        this.container.rebind(FlowService).to(AutopilotFlowService).inSingletonScope();
        this.container.rebind(ReporterService).to(AutopilotReporterService).inSingletonScope();

        // TODO inbox: this allows providing IoC with adhoc-bound managers
        // Clean this up after everything is migrated to IoC
        this.container.bind(ViewportManager).toDynamicValue(() => this.viewports);
        this.container.bind(LayoutManager).toDynamicValue(() => this.layout);
        this.container.bind(PlaybackManager).toDynamicValue(() => this.playback);

        // Old stuff
        this.inspector = new InspectManager(this);
        this.layout = new LayoutManager(this);
        this.playback = new PlaybackManager(this);
        this.recipes = new RecipeManager(this);
        this.viewports = new ViewportManager(this);

        this.ui = createUiControllers(this);
        this.uiControllers = Object.values(this.ui) as Controller[];

        // TODO Move those somewhere else
        ipcRenderer.on('focus', () => this.events.emit('windowFocused'));
        window.addEventListener('focusin', () => this.events.emit('focusChanged'));
        window.addEventListener('focusout', () => this.events.emit('focusChanged'));
        document.addEventListener('selectionchange', () => this.events.emit('selectionChanged'));
    }

    // TODO these are left for backwards compatibility
    // for those who still rely on accessing this.app.xxx to reach out for dependencies.
    // New controllers should use Inversify for that.
    // Vue components should use this.get(MyController) and import { MyController } from ~/controllers
    get browser() { return this.get(BrowserService); }
    get storage() { return this.get(StorageController); }
    get events() { return this.get(EventBus); }
    get resolver() { return this.get(ResolverService); }
    get proxy() { return this.get(ProxyService); }
    get settings() { return this.get(ct.SettingsController); }
    get project() { return this.get(ct.ProjectController); }
    get api() { return this.get(ct.ApiController); }
    get config() { return this.get(Configuration); }
    get tools() { return this.get(ToolsController); }
    get expandable() { return this.get(ct.ExpandableController); }
    get protocol() { return this.get(ct.ProtocolController); }

    async init() {
        // New controllers are initialized this way
        for (const ctl of this.getControllerInstances()) {
            const startedAt = Date.now();
            try {
                await ctl.init();
            } catch (err) {
                console.warn(`Failed to initialize ${ctl.constructor.name}, some functionality may be unavailable`, err);
            } finally {
                const duration = Date.now() - startedAt;
                if (duration > 50) {
                    console.warn(`🐢 ${ctl.constructor.name} initialized in ${ms(duration)}`);
                }
            }
        }

        // Note: order of initialization matters atm
        // Old initialization
        const managers: Controller[] = [
            this.layout,
            this.recipes,
            this.viewports,
        ];
        const ctrls = managers.concat(this.uiControllers);
        for (const ctl of ctrls) {
            try {
                await ctl.init();
            } catch (err) {
                console.warn(`Failed to initialize application, some functionality may be unavailable`, err);
            }
        }

        // This one remains in the new way
        await this.startSession();
        this.initialized = true;
        this.events.emit('initialized');
    }

    getControllerDescriptors() {
        return controllers.slice().sort((a, b) => a.priority > b.priority ? -1 : 1);
    }

    getControllerInstances() {
        return this.getControllerDescriptors().map(_ => this.get(_.class));
    }

}
