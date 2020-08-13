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
                const jobId = await this.receiveJobId();
                await this.runner.run(jobId);
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

    async receiveJobId(): Promise<string> {
        const { workerTag } = this.state;
        const [, value] = await this.redis.brpop(`push:${workerTag}:jobs`, 0 as any);
        const { data: payload } = JSON.parse(value);
        return payload.jobId;
    }
}
