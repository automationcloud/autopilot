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

import { injectable, inject } from 'inversify';
import { WorkerState } from './state';
import { Runner } from './runner';
import { Redis } from 'ioredis';
import { RedisProvider } from './redis';
import { Logger, Configuration, numberConfig } from '@automationcloud/engine';

const EXECUTIONS_THRESHOLD = numberConfig('EXECUTIONS_THRESHOLD', 100);

@injectable()
export class QueueConsumer {
    protected redis: Redis;
    protected shouldConsume: boolean = false;
    protected consumePromise: Promise<void> | null = null;

    constructor(
        @inject(Configuration)
        protected config: Configuration,
        @inject(WorkerState)
        protected state: WorkerState,
        @inject(Runner)
        protected runner: Runner,
        @inject(Logger)
        protected logger: Logger,
        @inject(RedisProvider)
        protected redisProvider: RedisProvider,
    ) {
        this.redis = redisProvider.createClient({ lazyConnect: true });
    }

    isConsuming() {
        return !!this.consumePromise;
    }

    async startConsuming() {
        if (this.isConsuming()) {
            return;
        }
        this.shouldConsume = true;
        await this.redis.connect();
        this.consumePromise = this.consumeFromQueue().finally(() => {
            this.consumePromise = null;
        });
    }

    async waitTillConsumptionFinishes() {
        await this.consumePromise;
    }

    async stopConsuming() {
        this.shouldConsume = false;
        this.redis.disconnect();
        await this.waitTillConsumptionFinishes();
    }

    async consumeFromQueue() {
        while (this.shouldConsume) {
            try {
                this.state.state = 'idle';
                this.logger.info('Consuming executions from Redis list');
                const { jobId, organisationId } = await this.receiveItem();
                await this.runner.run(jobId, organisationId);
            } catch (error) {
                if (this.shouldConsume) {
                    this.logger.warn('Failed to run job, will try again in 2 seconds', { error });
                    await new Promise(r => setTimeout(r, 2000));
                }
            } finally {
                this.state.executionsProcessed += 1;
                if (this.state.executionsProcessed >= this.config.get(EXECUTIONS_THRESHOLD)) {
                    this.logger.info(`Worker processed ${this.state.executionsProcessed} executions, shutting down`);
                    this.shouldConsume = false;
                }
            }
        }
    }

    async receiveItem(): Promise<QueueItem> {
        const { workerTag } = this.state;
        const [, value] = await this.redis.brpop(`push:${workerTag}:jobs`, 0 as any);
        const { data: payload } = JSON.parse(value);
        return {
            jobId: payload.jobId,
            organisationId: payload.organisationId,
        };
    }
}

interface QueueItem {
    jobId: string;
    organisationId: string;
}
