import { injectable, inject } from 'inversify';
import {
    ChromeLauncher,
    SPKI_SIGNATURES,
    BrowserService,
    ProxyService,
    Configuration,
    stringConfig,
    booleanConfig,
    numberConfig,
} from '@automationcloud/engine';

const CHROME_PATH = stringConfig('CHROME_PATH');
const CHROME_USER_DIR = stringConfig('CHROME_USER_DIR', `${process.cwd()}/.tmp/chrome/user`);
const CHROME_CACHE_DIR = stringConfig('CHROME_CACHE_DIR', `${process.cwd()}/.tmp/chrome/cache`);
const CHROME_HEADLESS = booleanConfig('CHROME_HEADLESS', false);
const CHROME_STDIO = stringConfig('CHROME_STDIO', 'ignore');
const CHROME_SHUTDOWN_TIMEOUT = numberConfig('CHROME_SHUTDOWN_TIMEOUT', 5000);

@injectable()
export class ChromeLaunchService {
    launcher: ChromeLauncher;

    constructor(
        @inject(Configuration)
        protected config: Configuration,
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(ProxyService)
        protected proxy: ProxyService,
    ) {
        this.config = config;
        this.launcher = new ChromeLauncher({
            chromePort: browser.getChromePort(),
            chromePath: this.getPath(),
            userDataDir: this.getUserDir(),
            additionalArgs: [
                // '--single-process',
                // '--ipc-connection-timeout=10000',
                // '--disable-kill-after-bad-ipc',
                // '--no-zygote',
                // '--nacl-dangerous-no-sandbox-nonsfi',
                // '--disable-namespace-sandbox',
                // '--disable-seccomp-filter-sandbox',
                `--disk-cache-dir=${this.getCacheDir()}`,
                '--disk-cache-size=104857600', // 100MB
                `--proxy-server=http://127.0.0.1:${this.proxy.getProxyPort()}`,
                '--ignore-certificate-errors',
                '--window-size=1280,800',
                `--ignore-certificate-errors-spki-list=${SPKI_SIGNATURES.join(',')}`,
                'about:blank',
                config.get(CHROME_HEADLESS) ? '--headless' : null,
            ].filter(Boolean),
            terminateProcessOnExit: true,
            stdio: config.get(CHROME_STDIO),
        });
    }

    getPath() {
        return this.config.get(CHROME_PATH);
    }

    getCacheDir() {
        return this.config.get(CHROME_CACHE_DIR);
    }

    getUserDir() {
        return this.config.get(CHROME_USER_DIR);
    }

    async launch() {
        await this.launcher.launch();
    }

    async shutdown() {
        const timeout = this.config.get(CHROME_SHUTDOWN_TIMEOUT);
        await this.launcher.shutdown(timeout);
    }
}
