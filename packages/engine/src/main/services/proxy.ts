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

import { RoutingProxy } from '@automationcloud/uniproxy';
import { injectable, inject } from 'inversify';
import { Configuration, numberConfig, Logger } from '@automationcloud/cdp';
import { SessionHandler } from '../session';

const PROXY_PORT = numberConfig('PROXY_PORT', 3128);

@injectable()
@SessionHandler()
export class ProxyService extends RoutingProxy {
    constructor(
        @inject(Configuration)
        protected config: Configuration,
        @inject(Logger)
        logger: Logger,
    ) {
        super({
            logger
        });
    }

    async onSessionStart() {
        await this.init();
    }

    async onSessionFinish() {
        await this.shutdown(true);
    }

    getProxyPort() {
        return this.config.get(PROXY_PORT);
    }

    async init() {
        if (this.isRunning()) {
            return;
        }
        const port = this.getProxyPort();
        try {
            await this.start(port);
            this.logger.info(`Local proxy listening on ${port}`);
        } catch (err) {
            if (err.code === 'EADDRINUSE') {
                this.logger.warn(`Local proxy port is busy`, { err, port });
                return;
            }
            throw err;
        }
    }
}
