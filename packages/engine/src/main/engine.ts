import {
    BrowserService,
    BlobService,
    CheckpointService,
    GlobalsService,
    ProxyService,
    FetchService,
    UserAgentService,
    FlowService,
    ReporterService,
    ResolverService,
    StatsService,
    RegistryService,
    ApiRequest,
    EmulationService,
} from './services';
import { decorate, injectable, interfaces, Container } from 'inversify';
import { sessionHandlers } from './session';
import { Logger, ConsoleLogger, Configuration, EnvConfiguration } from '@automationcloud/cdp';
import { Extension } from './extension';

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
        this.container.bind(ProxyService).toSelf().inSingletonScope();
        this.container.bind(RegistryService).toSelf().inSingletonScope();
        this.container.bind(ReporterService).toSelf().inSingletonScope();
        this.container.bind(ResolverService).toSelf().inSingletonScope();
        this.container.bind(StatsService).toSelf().inSingletonScope();
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

    /**
     * Resolves all session lifecycle services and invokes `onSessionStart` callbacks on them.
     *
     * @public
     */
    async startSession() {
        for (const handler of sessionHandlers) {
            try {
                const service = this.findBinding(handler);
                if (!service) {
                    sessionHandlers.delete(handler);
                    continue;
                }
                await service.onSessionStart();
            } catch (error) {
                this.$logger.error('Session start handler failed', { error });
            }
        }
    }

    /**
     * Resolves all session lifecycle services and invokes `onSessionFinish` callbacks on them.
     *
     * @public
     */
    async finishSession() {
        for (const handler of sessionHandlers) {
            try {
                const service = this.findBinding(handler);
                if (!service) {
                    sessionHandlers.delete(handler);
                    continue;
                }
                await service.onSessionFinish();
            } catch (error) {
                this.$logger.error('Session finish handler failed', { error });
            }
        }
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

}
