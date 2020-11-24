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
    Engine,
    FlowService,
    ReporterService,
    CheckpointService,
    Logger as EngineLogger,
} from '@automationcloud/engine';
import {
    Logger as FrameworkLogger, Application, Router
} from '@ubio/framework';
import { ApiService } from './services/api';
import { CacheService } from './services/cache';
import { ChromeLaunchService } from './services/chrome';
import { ExtensionManager } from './services/extension-manager';
import { HeartbeatsService } from './services/heartbeats';
import { InputsService } from './services/inputs';
import { QueueConsumer } from './services/queue-consumer';
import { RedisProvider } from './services/redis';
import { RoxiService } from './services/roxi';
import { Runner } from './services/runner';
import { ScriptLoaderService } from './services/script-loader';
import { SignalsService } from './services/signals';
import { StatusRouter } from './routes/status';
import { WorkerCheckpointService } from './overrides/checkpoints';
import { WorkerFlowService } from './overrides/flow';
import { WorkerLogger } from './overrides/logger';
import { WorkerReporterService } from './overrides/reporter';
import { WorkerState } from './services/state';
import { Container } from 'inversify';

export class WorkerBaseApp extends Application {
    constructor() {
        super();

        // Worker App and Engine use shared container
        const engine = new Engine();
        this.container = Container.merge(engine.container, this.container) as Container;
        this.container.options.skipBaseClassChecks = true;
        engine.container = this.container;
        this.container.rebind('RootContainer').toConstantValue(this.container);
        this.container.bind(WorkerLogger).toSelf().inSingletonScope();
        this.container.rebind(EngineLogger).toService(WorkerLogger);
        this.container.rebind(FrameworkLogger).toService(WorkerLogger);

        // Overrides

        this.container.rebind(CheckpointService).to(WorkerCheckpointService).inSingletonScope();
        this.container.rebind(FlowService).to(WorkerFlowService).inSingletonScope();
        this.container.rebind(ReporterService).to(WorkerReporterService).inSingletonScope();

        // Worker Services

        this.container.bind(ApiService).toSelf().inSingletonScope();
        this.container.bind(CacheService).toSelf().inSingletonScope();
        this.container.bind(ChromeLaunchService).toSelf().inSingletonScope();
        this.container.bind(ExtensionManager).toSelf().inSingletonScope();
        this.container.bind(HeartbeatsService).toSelf().inSingletonScope();
        this.container.bind(InputsService).toSelf().inSingletonScope();
        this.container.bind(QueueConsumer).toSelf().inSingletonScope();
        this.container.bind(RedisProvider).toSelf().inSingletonScope();
        this.container.bind(RoxiService).toSelf().inSingletonScope();
        this.container.bind(Runner).toSelf().inSingletonScope();
        this.container.bind(ScriptLoaderService).toSelf().inSingletonScope();
        this.container.bind(SignalsService).toSelf().inSingletonScope();
        this.container.bind(WorkerState).toSelf().inSingletonScope();

        // Routes

        this.container.bind(Router).to(StatusRouter);
    }
}

/**
 * Encapsulates worker lifecycle when run in cloud, as opposed to test and other environments.
 */
export class WorkerProductionApp extends WorkerBaseApp {
    shutdownPromise: Promise<void> | null = null;

    constructor() {
        super();
        this.container.bind('WorkerProductionApp').toConstantValue(this);
    }

    async beforeStart() {
        await super.beforeStart();
        const queueConsumer = this.container.get(QueueConsumer);
        const heartbeats = this.container.get(HeartbeatsService);
        const state = this.container.get(WorkerState);
        const cache = this.container.get(CacheService);
        const chrome = this.container.get(ChromeLaunchService);
        const extMgr = this.container.get(ExtensionManager);

        process.on('uncaughtException', error => {
            this.logger.error('uncaughtException', { error });
        });
        process.on('unhandledRejection', error => {
            this.logger.error('unhandledRejection', { error });
        });
        process.on('SIGTERM', () => {
            this.logger.info('Received SIGTERM, shutdown will be scheduled');
            // Note: App calls `.stop()` on SIGTERM, so we don't call it twice
        });

        try {
            heartbeats.start();
            await this.httpServer.startServer();
            await extMgr.loadAllLatestExtensions();
            await cache.retrieveCache('global');
            await chrome.launch();
            await queueConsumer.startConsuming();
            // Exit, when consumption is interrupted
            queueConsumer.waitTillConsumptionFinishes().then(() => this.stop());
            this.logger.info('Worker started', { info: state.getInfo() });
        } catch (error) {
            this.logger.error('Failed to start', { error });
            process.exit(1);
        }
    }

    async afterStop() {
        if (!this.shutdownPromise) {
            this.logger.info('Worker shutdown scheduled');
            // Prevent from scheduling shutdown twice
            this.shutdownPromise = this.shutdown();
        }
        await this.shutdownPromise;
    }

    async shutdown() {
        const cache = this.container.get(CacheService);
        const api = this.container.get(ApiService);
        const state = this.container.get(WorkerState);
        const queueConsumer = this.container.get(QueueConsumer);
        const heartbeats = this.container.get(HeartbeatsService);

        try {
            this.logger.info('Shutdown: stop sending heartbeat');
            heartbeats.stop();
            this.logger.info('Shutdown: wait for executions to finish');
            await queueConsumer.stopConsuming();
            this.logger.info('Shutdown: storing global cache');
            await cache.storeCache('global');
            this.logger.info('Shutdown: unregistering the worker');
            await api.deleteWorker(state.workerId);
            await this.httpServer.stopServer();
            await super.afterStop();
            process.exit(0);
        } catch (error) {
            this.logger.info('Worker shutdown failed', { error });
            process.exit(1);
        }
    }
}
