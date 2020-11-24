import { inject, injectable } from 'inversify';
import { SslBumpProxy } from '@automationcloud/uniproxy';
import { SessionHandler } from '../session';
import { Configuration, Logger, numberConfig } from '@automationcloud/cdp';
import { readFileSync } from 'fs';
import http from 'http';
import net from 'net';
import path from 'path';

const caCert = readFileSync(path.join(__dirname, '../../../certs/ca.crt'), 'utf-8');
const caPrivateKey = readFileSync(path.join(__dirname, '../../../certs/ca.key'), 'utf-8');
const certPublicKey = readFileSync(path.join(__dirname, '../../../certs/public.key'), 'utf-8');
const certPrivateKey = readFileSync(path.join(__dirname, '../../../certs/private.key'), 'utf-8');

const PAN_PROXY_PORT = numberConfig('PAN_PROXY_PORT', 3129);

/**
 * Proxy for secure PAN replacement.
 */
@injectable()
@SessionHandler()
export class PanProxyService extends SslBumpProxy {

    constructor(
        @inject(Logger)
        logger: Logger,
        @inject(Configuration)
        protected config: Configuration,
    ) {
        super({
            logger,
            caCert,
            caPrivateKey,
            certPublicKey,
            certPrivateKey,
            certTtlDays: 365,
            certCacheMaxEntries: 100,
        });
    }

    getPort() {
        return this.config.get(PAN_PROXY_PORT);
    }

    async onSessionStart() {
        await this.init();
    }

    async onSessionFinish() {
        await this.shutdown(true);
    }

    async init() {
        if (this.isRunning()) {
            return;
        }
        const port = this.getPort();
        try {
            await this.start(port);
            this.logger.info(`PAN proxy listening on ${port}`);
        } catch (err) {
            if (err.code === 'EADDRINUSE') {
                this.logger.warn(`PAN proxy port is busy`, { err, port });
                return;
            }
            throw err;
        }
    }

    async handleRequest(req: http.IncomingMessage, res: http.ServerResponse, remote: net.Socket): Promise<void> {
        // TODO do some work here
        // eslint-disable-next-line no-console
        console.log('hey', req.url);
        await this.passthrough(req, res, remote);
    }

}
