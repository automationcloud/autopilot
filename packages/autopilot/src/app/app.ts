// Copyright 2020 UBIO Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
    ApiRequest,
    BrowserService,
    CheckpointService,
    Configuration,
    ConsoleLogger,
    Engine,
    FlowService,
    HttpCallbackService,
    Logger,
    ProxyService,
    ReporterService,
    ResolverService,
} from '@automationcloud/engine';
import { ipcRenderer } from 'electron';
import ms from 'ms';

import { controllers } from './controller';
import { ApiController } from './controllers/api';
import { EventsController } from './controllers/events';
import { ExpandableController } from './controllers/expandable';
import { LayoutController } from './controllers/layout';
import { ProjectController } from './controllers/project';
import { ProtocolController } from './controllers/protocol';
import { SettingsController } from './controllers/settings';
import { StorageController } from './controllers/storage';
import { ToolsController } from './controllers/tools';
import { AutopilotApiRequest } from './overrides/api-request';
import { AutopilotBrowserService } from './overrides/browser';
import { AutopilotCheckpointService } from './overrides/checkpoint';
import { AutopilotConfiguration } from './overrides/config';
import { AutopilotFlowService } from './overrides/flow';
import { AutopilotHttpCallbackService } from './overrides/http-callback';
import { AutopilotReporterService } from './overrides/reporter';
import { AppUiControllers, createUiControllers } from './ui';
import * as v from './viewports';

export class App extends Engine {
    viewports: Viewports;
    ui: AppUiControllers;

    initialized: boolean = false;
    profileCount: number = 0;

    constructor() {
        super();

        // TODO remove this binding, left for compatibility with viewports
        this.container.bind('App').toConstantValue(this);

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
        this.container.rebind(ApiRequest).to(AutopilotApiRequest).inSingletonScope();
        this.container.rebind(HttpCallbackService).to(AutopilotHttpCallbackService).inSingletonScope();

        // Deprecated
        this.viewports = {
            scriptFlow: new v.ScriptFlowViewport(this),
            scriptEditor: new v.ScriptEditorViewport(this),
            bundles: new v.BundlesViewport(this),
            extensions: new v.ExtensionsViewport(this),
            inspections: new v.InspectionsViewport(this),
            playbackEvents: new v.PlaybackEventsViewport(this),
            recipes: new v.RecipesViewport(this),
            searchScripts: new v.SearchScriptsViewport(this),
            settings: new v.SettingsViewport(this),
            browser: new v.BrowserViewport(this),
            screencast: new v.ScreencastViewport(this),
            helpResources: new v.HelpResourcesViewport(this),
        };
        this.container.bind('viewports').toConstantValue(this.viewports);

        this.ui = createUiControllers(this);

        // TODO Move those somewhere else
        ipcRenderer.on('focus', () => this.events.emit('windowFocused'));
        window.addEventListener('focusin', () => this.events.emit('focusChanged'));
        window.addEventListener('focusout', () => this.events.emit('focusChanged'));
        document.addEventListener('selectionchange', () => this.events.emit('selectionChanged'));
    }

    // TODO these are left for backwards compatibility
    // for those who still rely on accessing this.app.xxx to reach out for dependencies.
    // New controllers should use Inversify for that.
    // Vue components should use inject['controllerAlias']
    get browser() { return this.get(BrowserService); }
    get storage() { return this.get(StorageController); }
    get events() { return this.get(EventsController); }
    get resolver() { return this.get(ResolverService); }
    get proxy() { return this.get(ProxyService); }
    get settings() { return this.get(SettingsController); }
    get project() { return this.get(ProjectController); }
    get api() { return this.get(ApiController); }
    get config() { return this.get(Configuration); }
    get tools() { return this.get(ToolsController); }
    get expandable() { return this.get(ExpandableController); }
    get protocol() { return this.get(ProtocolController); }
    get layout() { return this.get(LayoutController); }

    async init() {
        for (const { descriptor, instance } of this.getControllerInstances()) {
            const startedAt = Date.now();
            try {
                if (descriptor.backgroundInit) {
                    instance.init()
                        .catch(err => {
                            console.warn(`Failed to initialize ${instance.constructor.name}`, err);
                        });
                } else {
                    await instance.init();
                }
            } catch (err) {
                console.warn(`Failed to initialize ${instance.constructor.name}`, err);
            } finally {
                const duration = Date.now() - startedAt;
                if (duration > 50) {
                    console.warn(`🐢 ${instance.constructor.name} initialized in ${ms(duration)}`);
                }
            }
        }

        await this.initUiControllers();
        await this.initViewports();
        await this.startSession();
        this.initialized = true;
        this.events.emit('initialized');
    }

    getControllerDescriptors() {
        return controllers.slice().sort((a, b) => a.priority > b.priority ? -1 : 1);
    }

    getControllerInstances() {
        return this.getControllerDescriptors().map(descriptor => {
            const instance = this.get(descriptor.class);
            return {
                descriptor,
                instance,
            };
        });
    }

    /**
     * @deprecated use controllers instead, port these whenever time allows
     */
    protected async initUiControllers() {
        for (const ctl of Object.values(this.ui)) {
            try {
                await ctl.init();
            } catch (err) {
                console.warn(`Failed to initialize application, some functionality may be unavailable`, err);
            }
        }
    }

    /**
     * @deprecated use controllers instead, port these whenever time allows
     */
    protected async initViewports() {
        for (const viewport of Object.values(this.viewports)) {
            try {
                await viewport.init();
            } catch (err) {
                console.warn(`Failed to initialize viewport ${viewport.constructor.name}`, err);
            }
        }
    }

}

export interface Viewports {
    scriptFlow: v.ScriptFlowViewport;
    scriptEditor: v.ScriptEditorViewport;
    bundles: v.BundlesViewport;
    extensions: v.ExtensionsViewport;
    inspections: v.InspectionsViewport;
    playbackEvents: v.PlaybackEventsViewport;
    recipes: v.RecipesViewport;
    searchScripts: v.SearchScriptsViewport;
    settings: v.SettingsViewport;
    browser: v.BrowserViewport;
    screencast: v.ScreencastViewport;
    helpResources: v.HelpResourcesViewport;
}
