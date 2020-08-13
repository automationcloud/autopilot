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
