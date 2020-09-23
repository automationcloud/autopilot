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
