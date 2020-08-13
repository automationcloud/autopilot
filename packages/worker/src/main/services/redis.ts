import Redis from 'ioredis';
import { Logger, Configuration, stringConfig, numberConfig } from '@automationcloud/engine';
import { injectable, inject } from 'inversify';

const REDIS_HOST = stringConfig('REDIS_HOST');
const REDIS_PORT = numberConfig('REDIS_PORT', 6379);
const REDIS_DB = numberConfig('REDIS_DB', 0);

@injectable()
export class RedisProvider {
    @inject(Configuration)
    config!: Configuration;
    @inject(Logger)
    logger!: Logger;

    createClient(opts: any = {}) {
        const redis = new Redis({
            host: this.config.get(REDIS_HOST),
            port: this.config.get(REDIS_PORT),
            db: this.config.get(REDIS_DB),
            ...opts,
        });
        redis.on('error', error => {
            this.logger.error('Redis connection error', { error });
        });
        return redis;
    }
}
