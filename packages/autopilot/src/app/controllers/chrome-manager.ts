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

import os from 'os';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { SPKI_SIGNATURES, Target, stringConfig, BrowserService, ProxyService, booleanConfig } from '@automationcloud/engine';
import { controller } from '../controller';
import { injectable, inject } from 'inversify';
import { SettingsController } from './settings';
import { EventBus } from '../event-bus';

const CHROME_PATH = stringConfig('CHROME_PATH', '');
const CHROME_STDIO = stringConfig('CHROME_STDIO', 'ignore');
const CHROME_HOMEPAGE = stringConfig('CHROME_HOMEPAGE', 'https://robotschool.dev');
const CHROME_USE_HOMEPAGE = booleanConfig('CHROME_USE_HOMEPAGE', true);
const chromeUserDir = path.resolve(os.homedir(), '.autopilot', 'chrome', 'userdir');

@controller()
@injectable()
export class ChromeManagerController {
    chromeProcess: ChildProcess | null = null;
    connected: boolean = false;
    targets: Target[] = [];

    protected connectPromise: Promise<void> | null = null;

    constructor(
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(ProxyService)
        protected proxy: ProxyService,
        @inject(SettingsController)
        protected settings: SettingsController,
        @inject(EventBus)
        protected events: EventBus,
    ) {
        this.browser.on('targetAttached', target => this.onTargetAttached(target));
        this.browser.on('targetDetached', target => this.onTargetDetached(target));
        this.browser.on('connect', () => {
            this.connected = true;
        });
        this.browser.on('disconnect', () => {
            this.browser.detach();
            this.connected = false;
            this.connect();
        });
        this.events.on('initialized', () => {
            if (this.isUsingHomepage() && this.browser.isAttached()) {
                this.browser.page.navigate(this.getHomepageUrl());
            }
        });
    }

    async init() {
        await this.connect();
    }

    connect(): Promise<void> {
        if (!this.connectPromise) {
            this.connectPromise = this._connect();
        }
        return this.connectPromise;
    }

    isUsingHomepage() {
        return this.settings.get(CHROME_USE_HOMEPAGE);
    }

    getHomepageUrl() {
        return this.settings.get(CHROME_HOMEPAGE);
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
                await this.browser.connect();
            } catch (err) {
                console.debug('browser.connect failed, trying to run Chrome', err);
                this.runChrome();
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }

    protected async _attachToTab() {
        if (this.browser.isAttached()) {
            return;
        }
        // Try to attach to the first target
        let target = this.targets.find(_ => _.type === 'page');
        if (!target) {
            const page = await this.browser.newTab();
            target = page.target;
        }
        await this.browser.attach(target.targetId);
    }

    async refreshTargets() {
        this.targets = [...this.browser.attachedTargets()]
            .filter(target => target.type === 'page')
            .filter(target => !!target.url);
    }

    async updateChromePath(newChromePath: string) {
        this.settings.setEntries([['CHROME_PATH', newChromePath]]);
    }

    async restartChrome() {
        await new Promise((resolve) => {
            if (this.chromeProcess) {
                this.chromeProcess.on('exit', resolve);
                this.chromeProcess.kill('SIGTERM');
            } else {
                resolve();
            }
        });
        await this.init();
    }

    protected onTargetAttached(_target: Target) {
        this.refreshTargets();
    }

    protected onTargetDetached(target: Target) {
        this.refreshTargets();
        if (this.browser.isAttachedTo(target.targetId)) {
            this.browser.detach();
        }
    }

    protected runChrome() {
        if (this.chromeProcess) {
            return;
        }
        const chromePath = this.settings.get(CHROME_PATH);
        if (!chromePath) {
            console.warn('CHROME_PATH not set, Chrome will not run');
            return;
        }
        const chromePort = this.browser.getChromePort();
        const proxyPort = this.proxy.getProxyPort();
        const stdio = this.settings.get(CHROME_STDIO) as ProcessStdio;
        const args = [
            `--remote-debugging-port=${chromePort}`,
            // `--proxy-server=http://localhost:${proxyPort}`,
            `--ignore-certificate-errors-spki-list=${SPKI_SIGNATURES.join(',')}`,
            `--proxy-server=http://127.0.0.1:${proxyPort}`,
            `--user-data-dir=${chromeUserDir}`
        ];
        this.chromeProcess = spawn(chromePath, args, { stdio });
        this.chromeProcess.on('exit', () => {
            this.chromeProcess = null;
        });
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

export type ProcessStdio = 'pipe' | 'ignore' | 'inherit';
