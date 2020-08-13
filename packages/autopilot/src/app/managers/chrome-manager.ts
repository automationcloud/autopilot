import { App } from '../app';
import os from 'os';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { SPKI_SIGNATURES, Target, stringConfig } from '@automationcloud/engine';

const CHROME_PATH = stringConfig('CHROME_PATH', getDefaultChromePath());
const CHROME_STDIO = stringConfig('CHROME_STDIO', 'ignore');
const chromeUserDir = path.resolve(os.homedir(), '.autopilot', 'chrome', 'userdir');

export class ChromeManager {
    app: App;

    chromeProcess: ChildProcess | null = null;
    connected: boolean = false;
    targets: Target[] = [];

    protected connectPromise: Promise<void> | null = null;

    constructor(app: App) {
        this.app = app;
        this.app.browser.on('targetAttached', target => this.onTargetAttached(target));
        this.app.browser.on('targetDetached', target => this.onTargetDetached(target));
        this.app.browser.on('connect', () => {
            this.connected = true;
        });
        this.app.browser.on('disconnect', () => {
            this.app.browser.detach();
            this.connected = false;
            this.connect();
        });
    }

    // Connection

    async init() {
        await this.connect();
    }

    connect(): Promise<void> {
        if (!this.connectPromise) {
            this.connectPromise = this._connect();
        }
        return this.connectPromise;
    }

    protected async _connect() {
        try {
            await this._tryConnectBrowser();
            await new Promise(r => setTimeout(r, 100));
            await this._attachToTab();
        } catch (err) {
            console.error('Connect to Chrome failed', err);
        } finally {
            this.connectPromise = null;
        }
    }

    protected async _tryConnectBrowser() {
        for (let i = 0; i < 10; i++) {
            try {
                if (this.connected) {
                    return;
                }
                await this.app.browser.connect();
            } catch (err) {
                console.warn('browser.connect failed, trying to run Chrome', err);
                this.runChrome();
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }

    protected async _attachToTab() {
        if (this.app.browser.isAttached()) {
            return;
        }
        // Try to attach to the first target
        let target = this.targets.find(_ => _.type === 'page');
        if (!target) {
            const page = await this.app.browser.newTab();
            target = page.target;
        }
        await this.app.browser.attach(target.targetId);
    }

    async refreshTargets() {
        this.targets = [...this.app.browser.attachedTargets()]
            .filter(target => target.type === 'page')
            .filter(target => !!target.url);
    }

    protected onTargetAttached(_target: Target) {
        this.refreshTargets();
    }

    protected onTargetDetached(target: Target) {
        this.refreshTargets();
        if (this.app.browser.isAttachedTo(target.targetId)) {
            this.app.browser.detach();
        }
    }

    protected runChrome() {
        if (this.chromeProcess) {
            return;
        }
        const chromePort = this.app.browser.getChromePort();
        const proxyPort = this.app.proxy.getProxyPort();
        const chromePath = this.app.settings.get(CHROME_PATH);
        const stdio = this.app.settings.get(CHROME_STDIO) as ProcessStdio;

        const args = [
            `--remote-debugging-port=${chromePort}`,
            // `--proxy-server=http://localhost:${proxyPort}`,
            `--ignore-certificate-errors-spki-list=${SPKI_SIGNATURES.join(',')}`,
            `--proxy-server=http://127.0.0.1:${proxyPort}`,
            `--user-data-dir=${chromeUserDir}`,
        ];
        this.chromeProcess = spawn(chromePath, args, { stdio });
        if (this.chromeProcess.stdout) {
            this.chromeProcess.stdout.on('data', data => {
                console.debug('chrome stdout', data.toString());
            });
        }
        if (this.chromeProcess.stderr) {
            this.chromeProcess.stderr.on('data', data => {
                console.warn('chrome stderr', data.toString());
            });
        }
    }
}

function getDefaultChromePath(): string {
    const homedir = os.homedir();
    switch (os.platform()) {
        case 'win32':
            return path.resolve(homedir, 'AppData/Local/Google/Chrome SxS/Application/chrome.exe');
        case 'darwin':
            return '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary';
        case 'linux':
        default:
            return '/usr/bin/google-chrome-unstable';
    }
}

export type ProcessStdio = 'pipe' | 'ignore' | 'inherit';
