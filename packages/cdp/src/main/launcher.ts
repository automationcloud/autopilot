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

import { ChildProcess, spawn } from 'child_process';
import net from 'net';
import os from 'os';
import rimraf from 'rimraf';

import { Exception } from './exception';

const STANDARD_PATHS: { [index: string]: string } = {
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    linux: '/opt/google/chrome/chrome',
    win32: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
};

const DEFAULT_ARGS = [
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-cloud-import',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-extensions-http-throttling',
    '--disable-extensions',
    '--disable-features=site-per-process',
    '--disable-gpu-sandbox',
    '--disable-gpu',
    '--disable-hang-monitor',
    '--disable-http2',
    '--disable-plugins',
    '--disable-popup-blocking',
    '--disable-print-preview',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-setuid-sandbox',
    '--disable-smooth-scrolling',
    '--disable-sync',
    '--disable-translate-new-ux',
    '--disable-translate',
    '--disable-webgl',
    '--disk-cache-size=50000000',
    '--media-cache-size=50000000',
    '--metrics-recording-only',
    '--no-default-browser-check',
    '--no-experiments',
    '--no-first-run',
    '--no-pings',
    '--no-sandbox',
    '--password-store=basic',
    '--prerender-from-omnibox=disabled',
    '--safebrowsing-disable-auto-update',
    '--use-mock-keychain',
    '--use-spdy=off',
];

export class ChromeLauncher {
    childProcess: ChildProcess | null = null;
    options: ChromeLauncherOptions;

    constructor(options?: ChromeLauncherOptions) {
        this.options = {
            chromePath: STANDARD_PATHS[os.platform()],
            chromeAddress: '127.0.0.1',
            chromePort: 9222,
            userDataDir: `${os.tmpdir()}/${Math.random().toString(36)}`,
            stdio: 'ignore',
            env: {},
            args: DEFAULT_ARGS,
            additionalArgs: [],
            terminateProcessOnExit: true,
            connectionTimeout: 5000,
            ...options,
        };
    }

    getEffectiveArgs(): string[] {
        const { args, additionalArgs } = this.options;
        const result = args!.slice().concat(additionalArgs!) as string[];
        if (!result.some(a => /^--user-data-dir=/.test(a))) {
            result.push(`--user-data-dir=${this.options.userDataDir}`);
        }
        if (!result.some(a => /^--remote-debugging-port=/.test(a))) {
            result.push(`--remote-debugging-port=${this.options.chromePort}`);
        }
        if (!result.some(a => /^--remote-debugging-address=/.test(a))) {
            result.push(`--remote-debugging-address=${this.options.chromeAddress}`);
        }
        return result;
    }

    async launch() {
        if (this.childProcess) {
            throw new Exception({
                name: 'ChromeAlreadyRunning',
                message: 'Chrome has already been launched',
                retry: false,
            });
        }
        const { chromePath, env, stdio } = this.options;
        const args = this.getEffectiveArgs();
        this.childProcess = spawn(chromePath!, args, {
            stdio,
            env: { ...process.env, ...env },
        });
        if (this.options.terminateProcessOnExit) {
            const exitListener = () => this.stop();
            process.addListener('exit', exitListener);
            this.childProcess.once('exit', () => process.removeListener('exit', exitListener));
        }
        this.childProcess.once('exit', () => {
            this.childProcess = null;
        });
        await this.waitForPort();
    }

    stop() {
        if (this.childProcess) {
            this.childProcess.kill();
        }
    }

    async shutdown(timeout: number) {
        return new Promise<void>(resolve => {
            if (!this.childProcess) {
                return resolve();
            }
            const timer = setTimeout(() => {
                const { userDataDir } = this.options;
                if (this.childProcess) {
                    this.childProcess.kill('SIGKILL');
                    this.childProcess = null;
                    if (userDataDir) {
                        rimraf.sync(userDataDir);
                    }
                }
                resolve();
            }, timeout);
            this.childProcess.on('exit', () => {
                clearTimeout(timer);
                resolve();
            });
            this.childProcess.kill();
        });
    }

    async waitForPort() {
        const { connectionTimeout } = this.options;
        const startedAt = Date.now();
        while (Date.now() < startedAt + connectionTimeout!) {
            try {
                await this.tryConnect();
                return;
            } catch (err) {
                await new Promise(r => setTimeout(r, 200));
            }
        }
        throw new Exception({
            name: 'ChromeLaunchFailed',
            message:
                'Could not connect to Chrome debugging port after launch. ' +
                'Make sure valid --remote-debugging-port is used and ' +
                ' that another Chrome instance is not running',
            retry: false,
        });
    }

    async tryConnect() {
        const { chromePort } = this.options;
        return new Promise<void>((resolve, reject) => {
            const onConnect = () => {
                socket.destroy();
                resolve();
            };
            const onError = (err: Error) => {
                socket.destroy();
                reject(err);
            };
            const socket = net.createConnection({
                host: 'localhost',
                port: chromePort!,
            });
            socket.on('connect', onConnect);
            socket.on('error', onError);
        });
    }
}

interface ChromeLauncherOptions {
    chromePath?: string;
    chromeAddress?: string;
    chromePort?: number;
    userDataDir?: string;
    env?: object;
    stdio?: any;
    args?: Array<string | null>;
    additionalArgs?: Array<string | null>;
    terminateProcessOnExit?: boolean;
    connectionTimeout?: number;
}
