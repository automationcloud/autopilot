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

import { ChromeLauncher } from '@automationcloud/cdp';
import assert from 'assert';
import path from 'path';

import { Element } from './element';
import { Engine } from './engine';
import { Extension } from './extension';
import { FlowServiceMock } from './mocks';
import { Pipeline } from './pipeline';
import { Script } from './script';
import { BrowserService, FlowService } from './services';

class UnexpectedSuccessError extends Error {
    code: string = 'UnexpectedSuccess';
}

/**
 * Utility class for simplifying common tests.
 *
 * @beta
 */
export class TestRig {
    engine: Engine;
    launcher: ChromeLauncher;

    chromePort = Number(process.env.CHROME_PORT) || 9123;
    chromePath = process.env.CHROME_PATH || undefined;
    chromeHeadless = process.env.CHROME_HEADLESS === 'true';

    constructor() {
        this.engine = new Engine();
        this.launcher = new ChromeLauncher({
            chromePort: this.chromePort,
            chromePath: this.chromePath,
            userDataDir: path.resolve(process.cwd(), '.tmp/chromedata'),
            additionalArgs: [
                '--site-per-process',
                this.chromeHeadless ? '--headless' : null,
                ...this.getChromeAdditionalArgs(),
                'about:blank'
            ],
        });
    }

    getChromeAdditionalArgs(): string[] {
        return [];
    }

    /**
     * Override this to setup engine service bindings.
     */
    setupEngine() {
        this.engine.container.bind(FlowServiceMock).toSelf().inSingletonScope();
        this.engine.container.rebind(FlowService).toService(FlowServiceMock);
    }

    async beforeAll() {
        await this.launcher.launch();
    }

    async afterAll() {
        await this.launcher.shutdown(1000);
    }

    async beforeEach() {
        this.engine = new Engine();
        this.setupEngine();
        await this.engine.startSession();
        await this.browser.connect();
        await this.openNewTab();
    }

    async afterEach() {
        await this.engine.finishSession();
        await this.closeTab();
        this.browser.disconnect();
    }

    get browser() {
        return this.engine.get(BrowserService);
    }

    get page() {
        return this.browser.page;
    }

    get flow() {
        return this.engine.get(FlowServiceMock);
    }

    async openNewTab() {
        const { browserContextId } = await this.browser.createBrowserContext();
        const tab = await this.browser.newTab(browserContextId);
        await this.browser.attach(tab.target.targetId);
    }

    async closeTab() {
        const { page } = this;
        page.close();
        if (page.target.browserContextId) {
            await this.browser.disposeBrowserContext(page.target.browserContextId);
        }
        this.browser.detach();
    }

    createScript(spec: any): Script {
        return new Script(this.engine, spec);
    }

    createScriptWithActions(actions: any[]): Script {
        return this.createScript({
            name: 'test',
            contexts: [{ type: 'main', actions }],
        });
    }

    createPipeline(pipes: any[]): Pipeline {
        const script = this.createScript({});
        const context = script.getMainContext();
        const def = context.definitions.insert({
            type: 'definition',
            pipeline: pipes,
        }, 0);
        return (def as any).pipeline;
    }

    async runPipes(pipes: any[]): Promise<Element[]> {
        const pipeline = this.createPipeline(pipes);
        return this.runPipeline(pipeline);
    }

    async runPipeline(pipeline: Pipeline): Promise<Element[]> {
        const inputSet = await pipeline.$action.resolveScope();
        return await pipeline.selectAll(inputSet, pipeline.$action.createCtx());
    }

    async runActions(actions: any[]): Promise<void> {
        const script = this.createScriptWithActions(actions);
        await script.runAll();
    }

    async assertError(code: string, asyncFn: () => any): Promise<Error> {
        try {
            await asyncFn();
            throw new UnexpectedSuccessError();
        } catch (err) {
            assert.equal(err.code, code);
            return err;
        }
    }

}

export class ExtensionTestRig extends TestRig {
    extension!: Extension;

    constructor(public extensionDir: string) {
        super();
    }

    /**
     * Override this to setup extension service bindings.
     */
    setupExtension() {}

    get container() {
        return this.extension.container;
    }

    async beforeAll() {
        await super.beforeAll();
    }

    async beforeEach() {
        this.engine = new Engine();
        this.setupEngine();
        this.extension = await Extension.load(this.extensionDir);
        this.engine.addExtension(this.extension);
        this.setupExtension();
        await this.engine.startSession();
        await this.browser.connect();
        await this.openNewTab();
    }

}
