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
import { Configuration, numberConfig, Logger, stringConfig } from '@automationcloud/cdp';
import { SessionHandler } from '../session';
import http from 'http';
import net from 'net';
import { readFileSync } from 'fs';
import path from 'path';

const PROXY_PORT = numberConfig('PROXY_PORT', 3128);
const CA_CERTIFICATES = stringConfig('CA_CERTIFICATES', '');
const caCert = readFileSync(path.join(__dirname, '../../../ca.crt'), 'utf-8');

@injectable()
@SessionHandler()
export class ProxyService extends RoutingProxy {
    visitedHosts = new Set<string>();

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

    getCACertificates() {
        const defaults = super.getCACertificates();
        const ca = this.config.get(CA_CERTIFICATES);
        return [ ...defaults, ca, caCert].filter(Boolean);
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
        this.visitedHosts.clear();
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

    /**
     * Tracks visited hosts for HTTPS requests.
     */
    async onConnect(req: http.IncomingMessage, clientSocket: net.Socket) {
        this.visitedHosts.add(req.url!);
        return await super.onConnect(req, clientSocket);
    }

    /**
     * Tracks visited hosts for HTTP requests.
     */
    async onRequest(req: http.IncomingMessage, res: http.ServerResponse) {
        this.visitedHosts.add(req.headers.host!);
        return await super.onRequest(req, res);
    }
}
