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
    ApiRequest,
    HttpCallbackService,
} from '@automationcloud/engine';

import { ViewportManager } from './viewports/viewport-manager';
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
import { AutopilotApiRequest } from './overrides/api-request';
import { AutopilotHttpCallbackService } from './overrides/http-callback';

export class App extends Engine {
    // Deprecated
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
        this.container.rebind(ApiRequest).to(AutopilotApiRequest).inSingletonScope();
        this.container.rebind(HttpCallbackService).to(AutopilotHttpCallbackService).inSingletonScope();

        // TODO inbox: this allows providing IoC with adhoc-bound managers
        // Clean this up after everything is migrated to IoC
        this.container.bind(ViewportManager).toDynamicValue(() => this.viewports);

        // Old stuff
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
    get layout() { return this.get(ct.LayoutController); }

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

        // DEPRECATED: use controllers instead, port these whenever time allows
        // Old initialization
        // Note: order of initialization matters atm
        const ctrls = this.uiControllers.concat([this.viewports]);
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
        return this.getControllerDescriptors().map(descriptor => {
            const instance = this.get(descriptor.class);
            return {
                descriptor,
                instance,
            };
        });
    }

}
