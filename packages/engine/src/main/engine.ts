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

import { Configuration, ConsoleLogger, EnvConfiguration, Logger } from '@automationcloud/cdp';
import { Container, decorate, injectable, interfaces } from 'inversify';

import { Extension } from './extension';
import {
    ApiRequest,
    BlobService,
    BrowserService,
    CheckpointService,
    EmulationService,
    FetchService,
    FlowService,
    GlobalsService,
    HttpCallbackService,
    ProxyService,
    RegistryService,
    ReporterService,
    ResolverService,
    UserAgentService,
} from './services';
import { sessionHandlers, SessionLifecycleHandler } from './session';

// CDP modules need to be decorated
decorate(injectable(), ConsoleLogger);
decorate(injectable(), EnvConfiguration);

/**
 * Engine instance maintains a set of services that establish a runtime for executing the scripts.
 *
 * This includes the following noteworthy services:
 *
 * - {@link BrowserService} maintains connection to Chrome
 * - {@link FlowService} provides Script with ability to request inputs, send outputs and other flow control aspects
 * - {@link ProxyService} provides dynamic proxy configuration
 * - {@link FetchService} facilitates sending HTTP requests via either Chrome or Node.js environment
 * - {@link ResolverService} maintains a library of currently loaded Actions and Pipes
 *
 * A typical script assumes full control over the Engine and Chrome browser, therefore it is rarely
 * feasible to run multiple arbitrary scripts at the same time with the same engine.
 * Therefore, a typical script runtime environment will make both Engine and Scripts singletons,
 * with 1:1 relationship.
 *
 * The service resolution is facilitated by Inversify. Any engine service can be overridden to provide custom logic.
 *
 * @public
 */
export class Engine {
    container: Container;

    constructor() {
        this.container = new Container({ skipBaseClassChecks: true });
        this.container.bind(Engine).toConstantValue(this);

        this.container.bind(Logger).to(ConsoleLogger).inSingletonScope();
        this.container.bind(Configuration).to(EnvConfiguration).inSingletonScope();

        this.container.bind(ApiRequest).toSelf().inSingletonScope();
        this.container.bind(BlobService).toSelf().inSingletonScope();
        this.container.bind(BrowserService).toSelf().inSingletonScope();
        this.container.bind(CheckpointService).toSelf().inSingletonScope();
        this.container.bind(EmulationService).toSelf().inSingletonScope();
        this.container.bind(FetchService).toSelf().inSingletonScope();
        this.container.bind(FlowService).toSelf().inSingletonScope();
        this.container.bind(GlobalsService).toSelf().inSingletonScope();
        this.container.bind(HttpCallbackService).toSelf().inSingletonScope();
        this.container.bind(ProxyService).toSelf().inSingletonScope();
        this.container.bind(RegistryService).toSelf().inSingletonScope();
        this.container.bind(ReporterService).toSelf().inSingletonScope();
        this.container.bind(ResolverService).toSelf().inSingletonScope();
        this.container.bind(UserAgentService).toSelf().inSingletonScope();
    }

    /**
     * Resolves a service instance by its identifier. Engine uses classes as service identifiers.
     *
     * @param serviceIdentifier
     */
    get<T>(serviceIdentifier: interfaces.Newable<T> | interfaces.Abstract<T>): T {
        return this.container.get(serviceIdentifier);
    }

    get $logger() {
        return this.container.get(Logger);
    }

    get $resolver() {
        return this.container.get(ResolverService);
    }

    /**
     * @beta
     */
    addExtension(extension: Extension) {
        return this.get(ResolverService).addExtension(extension);
    }

    /**
     * @beta
     */
    removeExtension(extension: Extension) {
        this.get(ResolverService).removeExtension(extension);
    }

    /**
     * Invokes `onSessionStart` callbacks on all session handlers.
     *
     * @public
     */
    async startSession() {
        const promises = this.resolveSessionHandlers().map(async service => {
            try {
                if (service.onSessionStart) {
                    await service.onSessionStart();
                }
            } catch (error) {
                this.$logger.error('onSessionStart handler failed', {
                    serviceName: service.constructor.name,
                    error,
                });
            }
        });
        await Promise.all(promises);
    }

    /**
     * Invokes `onSessionFinish` callbacks on all session handlers.
     *
     * @public
     */
    async finishSession() {
        const promises = this.resolveSessionHandlers().map(async service => {
            try {
                if (service.onSessionFinish) {
                    await service.onSessionFinish();
                }
            } catch (error) {
                this.$logger.error('onSessionFinish handler failed', {
                    serviceName: service.constructor.name,
                    error,
                });
            }
        });
        await Promise.all(promises);
    }

    resolveSessionHandlers(): SessionLifecycleHandler[] {
        const services: SessionLifecycleHandler[] = [];
        for (const handler of sessionHandlers) {
            const service = this.findBinding(handler);
            if (service) {
                services.push(service);
            }
        }
        return services;
    }

    /**
     * Search for binding in enigne containers and in all extensions.
     * @private
     */
    protected findBinding<T>(serviceIdentifier: interfaces.Newable<T> | interfaces.Abstract<T>): T | null {
        if (this.container.isBound(serviceIdentifier)) {
            return this.container.get(serviceIdentifier);
        }
        const resolver = this.get(ResolverService);
        for (const ext of resolver.getExtensions()) {
            if (ext.isInitialized()) {
                if (ext.container.isBound(serviceIdentifier)) {
                    return ext.container.get(serviceIdentifier);
                }
            }
        }
        return null;
    }

    /**
     * Releases references to SessionHandler classes which are no longer bound by Engine.
     * This is invoked when extensions are unloaded to prevent memory leaks.
     *
     * @internal
     */
    cleanupUnusedSessionHandlers() {
        for (const handler of sessionHandlers) {
            const service = this.findBinding(handler);
            if (!service) {
                sessionHandlers.delete(handler);
            }
        }
    }

}
