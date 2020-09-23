// Copyright 2020 Ubio Limited
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

import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { injectable, inject } from 'inversify';
import { RedisProvider } from './redis';
import { Logger, SessionHandler } from '@automationcloud/engine';
import { WorkerState } from './state';

@injectable()
@SessionHandler()
export class SignalsService extends EventEmitter {
    @inject(Logger)
    logger!: Logger;
    @inject(WorkerState)
    state!: WorkerState;

    redis: Redis;
    consuming: boolean = false;

    constructor(
        @inject(RedisProvider)
        redisProvider: RedisProvider,
    ) {
        super();
        this.redis = redisProvider.createClient({ lazyConnect: true });
    }

    async onSessionStart() {
        await this.start();
    }

    async onSessionFinish() {
        this.stop();
    }

    async start() {
        this.consuming = true;
        await this.redis.connect();
        this.consumeQueue().catch(() => {});
    }

    stop() {
        this.consuming = false;
        this.redis.disconnect();
    }

    async consumeQueue() {
        const execution = this.state.getExecution();
        while (this.consuming) {
            try {
                const [, value] = await this.redis.brpop(`executions:${execution.id}:signals`, 0 as any);
                const { name: signal, data: payload } = JSON.parse(value);
                this.logger.info(`Received signal ${signal}`, { signal, payload });
                switch (signal) {
                    case 'job-input-create':
                        this.handleJobInputCreate(payload);
                        break;
                    case 'execution-state-update':
                        this.handleExecutionStateUpdate(payload);
                        break;
                    default:
                        this.logger.warn(`Unknown signal ${signal}`);
                        break;
                }
            } catch (error) {
                // Ignore disconnected error
                if (!this.consuming) {
                    return;
                }
                this.logger.error('Error while consuming signals', { error });
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }

    handleJobInputCreate(payload: any) {
        const { key, data } = payload;
        this.emit('input', key, data);
    }

    handleExecutionStateUpdate(payload: any) {
        const { state } = payload;
        if (state === 'terminated') {
            this.state.state = 'terminating-execution';
            this.emit('terminated');
        }
    }
}
