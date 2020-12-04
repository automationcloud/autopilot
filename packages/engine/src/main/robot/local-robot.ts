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

import { ChromeLauncher, ConsoleLogger, Exception, Logger } from '@automationcloud/cdp';
import { Script, ScriptInput, ScriptOutput } from '../script';
import { Engine } from '../engine';
import { FlowService, BrowserService } from '../services';
import { LocalFlowService } from './local-flow';
import path from 'path';
import { promises as fs } from 'fs';
import { createEventHandler, EventHandler } from '../util';

/**
 * A high level API for running Automation scripts locally.
 */
export class LocalRobot {
    config: LocalRobotConfig;
    engine: Engine;
    launcher: ChromeLauncher | null = null;
    script!: Script;

    protected constructor(options: Partial<LocalRobotConfig>) {
        if (!options.script) {
            throw new Exception({
                name: 'MissingScript',
                message: 'options.script is missing; should be either a path to local file or JSON'
            });
        }
        this.config = {
            script: {},
            logger: new ConsoleLogger(),
            chromePath: process.env.CHROME_PATH ?? null,
            chromeAddress: process.env.CHROME_ADDRESS ?? '127.0.0.1',
            chromePort: parseInt(process.env.CHROME_PORT!) || 9123,
            chromeHeadless: true,
            chromeAdditionalArgs: [],
            inputTimeout: 60000,
            closeAllTabs: false,
            closeActiveTab: true,
            ...options,
        };
        if (this.config.chromePath) {
            this.launcher = new ChromeLauncher({
                chromePath: this.config.chromePath,
                chromePort: this.config.chromePort,
                additionalArgs: [
                    this.config.chromeHeadless ? '--headless' : '',
                    ...this.config.chromeAdditionalArgs,
                ].filter(Boolean),
            });
        }
        this.engine = new Engine();
        this.configureEngine();
    }

    static async create(options: Partial<LocalRobotConfig>) {
        const robot = new LocalRobot(options);
        robot.script = await robot.initScript(robot.config.script);
        return robot;
    }

    protected configureEngine() {
        this.engine.container.bind('Robot').toConstantValue(this);
        this.engine.container.rebind(Logger).toConstantValue(this.config.logger);
        this.engine.container.bind(LocalFlowService).toSelf().inSingletonScope();
        this.engine.container.rebind(FlowService).toService(LocalFlowService);
    }

    get browser(): BrowserService {
        return this.engine.container.get(BrowserService);
    }

    /**
     * Runs the script with specified initial inputs till completion
     * (i.e. until either 'success' or 'fail' script events).
     *
     * It is possible to not `await` the returned promise immediately,
     * e.g. if you want to wait for outputs, submit inputs asynchronously, etc.
     * But regardless of the flow the returned promise should be `await`ed
     * to prevent unhandled rejections.
     *
     * For example:
     *
     * ```
     * const finish = robot.run();
     * const [foo, bar] = await robot.waitForOutputs('foo', 'bar');
     * // ...
     * await finish;
     * ```
     *
     * @public
     */
    async run(inputObject: Record<string, any> = {}) {
        try {
            this.initInputs(inputObject);
            await this.prepareChrome();
            await this.browser.openNewTab();
            await this.engine.startSession();
            await this.script.runAll();
        } finally {
            await this.finalize();
        }
    }

    /**
     * Resolves when all outputs with specified `keys` are available.
     * The output data is returned as an array in the same order as specified keys.
     *
     * ProTip™ Use destructuring to access the data:
     *
     * ```
     * const [products, deliveryOptions] = await job.waitForOutputs('products', 'deliveryOptions');
     * ```
     *
     * @param keys output keys
     * @public
     */
    async waitForOutputs(...keys: string[]): Promise<any[]> {
        return await this.script.waitForOutputs(...keys);
    }

    /**
     * Submits input with specified `key` and `data`.
     * Useful when input data depends on some other criteria (e.g. derived from outputs).
     *
     * @param key input key
     * @param data input data
     * @public
     */
    submitInput(key: string, data: any) {
        const input: ScriptInput = { key, data };
        this.script.$inputs.push(input);
        this.script.$events.emit('inputSubmitted', input);
        return input;
    }

    /**
     * Register a handler for `awaitingInput` event.
     * When input with specified `key` is requested by script, the supplied `fn` handler is invoked.
     *
     * Unless the handler returns `undefined`, the result value is sent as input data for that key,
     * fulfilling the input request.
     *
     * Use this to handle deferred inputs.
     *
     * @param key requested input key, `*` to receive all events.
     * @param fn handler callback, can be either synchronous or asynchronous; the return value is
     *  submitted as input data for specified input `key`
     * @public
     */
    onAwaitingInput(key: string, fn: (key: string) => any | Promise<any>): EventHandler {
        return createEventHandler(this.script.$events, 'awaitingInput', async (requestedKey: string) => {
            if (key === '*' || requestedKey === key) {
                const data = await fn(requestedKey);
                if (data !== undefined) {
                    this.submitInput(key, data);
                }
            }
        });
    }

    /**
     * Subscribes to `success` event.
     *
     * When the script finishes successfully the handler `fn` is invoked.
     *
     * @param fn handler callback, can be either synchronous or asynchronous
     * @public
     */
    onSuccess(fn: () => void | Promise<void>): EventHandler {
        return createEventHandler(this.script.$events, 'success', fn);
    }

    /**
     * Subscribes to `fail` event.
     *
     * When the script fails the handler `fn` is invoked with error info passed as a parameter.
     *
     * @param fn handler callback, can be either synchronous or asynchronous
     * @public
     */
    onFail(fn: (err: Error) => void | Promise<void>): EventHandler {
        return createEventHandler(this.script.$events, 'fail', fn);
    }

    /**
     * Subscribes to `output` event for specified output `key`.
     *
     * When output with specified `key` is emitted by script, the handler `fn` is invoked.
     *
     * @param key output key
     * @param fn handler callback, can be either synchronous or asynchronous
     * @public
     */
    onOutput(key: string, fn: (outputData: any) => void | Promise<void>): EventHandler {
        return createEventHandler(this.script.$events, 'output', async (output: ScriptOutput) => {
            if (output.key === key) {
                await fn(output.data);
            }
        });
    }

    /**
     * Subscribes to `output` event for all output keys.
     *
     * When any output is emitted by script, the handler `fn` is invoked.
     *
     * @param fn handler callback, can be either synchronous or asynchronous
     * @public
     */
    onAnyOutput(fn: (outputKey: string, outputData: any) => void | Promise<void>): EventHandler {
        return createEventHandler(this.script.$events, 'output', async (output: ScriptOutput) => {
            await fn(output.key, output.data);
        });
    }

    protected async finalize() {
        try {
            if (this.config.closeAllTabs) {
                this.browser.closeAllTabs();
            } else if (this.config.closeActiveTab && this.browser.isAttached()) {
                this.browser.page.close();
            }
            this.browser.detach();
            await this.engine.finishSession();
        } catch (error) {
            this.config.logger.warn(`Finalization failed`, { ...error });
        }
    }

    protected async initScript(scriptOrPath: any): Promise<Script> {
        switch (typeof scriptOrPath) {
            case 'object': {
                // Script spec is inferred based on object properties
                const spec = [scriptOrPath, scriptOrPath.script].find(obj => {
                    return obj && typeof obj.id === 'string' && typeof obj.contexts === 'object';
                });
                if (spec) {
                    return await Script.load(this.engine, spec);
                }
                throw new Exception({
                    name: 'BadScript',
                    message: 'Could not recognize script format: script JSON should contain `id` and `context` fields',
                });
            }
            case 'string': {
                const file = path.resolve(process.cwd(), scriptOrPath);
                const content = await fs.readFile(file, 'utf-8');
                const json = JSON.parse(content);
                return await this.initScript(json);
            }
            default:
                throw new Exception({
                    name: 'ScriptInitFailed',
                    message: 'Script should be either an object or a path to local file',
                });
        }
    }

    protected initInputs(inputObject: Record<string, any>) {
        for (const [key, data] of Object.entries(inputObject)) {
            this.script.$inputs.push({ key, data });
        }
    }

    protected async prepareChrome() {
        try {
            await this.browser.connect();
        } catch {
            if (!this.launcher) {
                throw new Exception({
                    name: 'ChromeConnectionFailed',
                    message: 'Could not establish connection to Chrome, ' +
                        'and chromePath is not provided, so not running Chrome automatically.'
                });
            }
            await this.launcher.launch();
            await this.browser.connect();
        }
    }

}

export interface LocalRobotConfig {
    /**
     * Either a path to local file containing a script created an Autopilot, or the JSON object
     * representing the serialized script.
     */
    script: string | object;
    /**
     * Local path to Chromium executable.
     * Default is taken from `CHROME_PATH` environment variable.
     *
     * If `null` specified, Robot won't attempt to run Chrome and instead will
     * try connect to specified address and port.
     */
    chromePath: string | null;
    /**
     * Chrome CDP address, as specified in `--remote-debugging-address` command line parameter.
     * Default: `127.0.0.1`
     */
    chromeAddress: string;
    /**
     * Chrome CDP port, as specified in `--remote-debugging-port` command line parameter.
     * Default: `9123`
     */
    chromePort: number;
    /**
     * Indicates whether `--headless` command line parameter will be used to launch Chromium.
     * Default: `false`.
     */
    chromeHeadless: boolean;
    /**
     * An array with additional arguments used to launch Chromium. Default: `[]`.
     */
    chromeAdditionalArgs: string[];
    /**
     * The duration in milliseconds of waiting for the requested input before failing the execution
     * with `InputTimeout` error. Default: `60000` (1 minute).
     */
    inputTimeout: number;
    /**
     * Whether to close all existing tabs after the script execution is finished. Default: `false`.
     */
    closeAllTabs: boolean;
    /**
     * Whether to close the active tab after the script execution is finished.
     * Leaving the tab open can be handy for debugging, but not so much for automating on scale.
     * Default: `true`.
     */
    closeActiveTab: boolean;
    /**
     * Custom logger can be provided, otherwise standard console logger will be used.
     */
    logger: Logger;
}
