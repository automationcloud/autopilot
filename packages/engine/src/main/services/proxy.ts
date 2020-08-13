import { RoutingProxy } from '@automationcloud/routing-proxy';
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
        protected logger: Logger,
    ) {
        super();
        this.on('error', error => {
            if (error.code !== 'EPIPE' && error.code !== 'ECONNRESET') {
                logger.warn('Proxy error', { error });
            }
        });
    }

    async onSessionStart() {
        await this.init();
    }

    async onSessionFinish() {
        if (!this.isRunning()) {
            await this.init();
        }
        this.closeAllSockets();
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
