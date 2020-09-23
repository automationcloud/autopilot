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

import { injectable, inject } from 'inversify';
import { WorkerState } from './state';
import { ApiService } from './api';
import { Execution } from '../types';
import { ChromeLaunchService } from './chrome';
import { CacheService } from './cache';
import {
    Script,
    util,
    Context,
    Action,
    ReporterService,
    BrowserService,
    CheckpointService,
    Engine,
    Logger,
    StatsService,
} from '@automationcloud/engine';
import { SignalsService } from './signals';
import { ScriptLoaderService } from './script-loader';
import { RoxiService } from './roxi';

@injectable()
export class Runner {
    constructor(
        @inject(WorkerState)
        protected state: WorkerState,
        @inject(ApiService)
        protected api: ApiService,
        @inject(Logger)
        protected logger: Logger,
        @inject(ChromeLaunchService)
        protected chrome: ChromeLaunchService,
        @inject(CacheService)
        protected cache: CacheService,
        @inject(RoxiService)
        protected roxi: RoxiService,
        @inject(SignalsService)
        protected signals: SignalsService,
        @inject(ScriptLoaderService)
        protected scriptCache: ScriptLoaderService,
        @inject(ReporterService)
        protected reporter: ReporterService,
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(CheckpointService)
        protected checkpoints: CheckpointService,
        @inject(Engine)
        protected engine: Engine,
        @inject(StatsService)
        protected statsService: StatsService,
    ) {
        browser.on('disconnect', () => {
            state.state = 'disconnected';
        });
    }

    async run(jobId: string, organisationId: string): Promise<void> {
        this.state.jobStartedAt = Date.now();
        this.state.organisationId = organisationId;
        this.state.jobId = jobId;
        this.state.state = 'initializing';
        this.api.setOrganisationId(organisationId);
        const execution = await this.api.createExecution({
            jobId,
            workerId: this.state.workerId,
            workerVersion: this.state.workerVersion,
        });
        this.state.setExecution(execution);
        if (execution.state === 'fail') {
            this.logger.warn('API created failed execution, ignoring it', { execution });
            return;
        }
        await this.processExecution(execution);
    }

    protected async processExecution(execution: Execution) {
        try {
            this.logger.info('Execution created', { execution });
            const script = await this.initializeScript(execution);
            this.state.script = script;

            await this.connectToBrowser();
            await this.engine.startSession();
            await this.restoreCheckpoint();

            this.state.state = 'running';
            this.logger.info('Running script');
            await script.run('script');
            await this.handleSuccess();
        } catch (err) {
            await this.handleFail(err);
        } finally {
            await this.finalize();
        }
    }

    async handleSuccess() {
        this.logger.info('Execution success');
        await this.reporter.sendEvent('info', 'success');
        await this.setExecutionSuccess();
        await this.reporter.sendScreenshot('info', {
            isPublic: false,
            fullPage: false,
            label: 'success',
        });
        await this.reporter.sendScreenshot('info', {
            isPublic: true,
            fullPage: true,
            label: 'success',
        });
        await this.reporter.sendHtmlSnapshot('info');
    }

    async handleFail(error: any) {
        if (!error.code) {
            error.code = error.name || error.constructor.name;
        }
        // Note: at this point script may not exist yet
        const script = this.state.script;
        const playhead = script ? script.$playback.playhead : null;
        const context = playhead ? playhead.$context : null;
        const stats = {
            proxyId: this.state.getExecution().proxyId,
            ip: this.state.getExecution().ip,
            workerVersion: this.state.workerVersion,
            sessionTotalTime: Date.now() - this.state.jobStartedAt,
            visitedOrigins: this.statsService.visitedOrigins,
            httpRequestsCount: this.statsService.httpRequestsCount,
            numberOfHttpRequests: this.statsService.httpRequestsCount,
        };
        this.logger.info('Execution fail', { error, stats });
        await this.reporter.sendEvent('error', 'error', {
            action: playhead,
            context,
            details: {
                error: {
                    name: error.name,
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    stack: error.stack,
                },
                stats,
            },
        });
        await this.failExecution(error);
        await this.reporter.sendScreenshot('error', {
            isPublic: false,
            fullPage: false,
            label: 'error',
        });
        await this.reporter.sendScreenshot('error', {
            isPublic: true,
            fullPage: true,
            label: 'error',
        });
        await this.reporter.sendHtmlSnapshot('error');
    }

    async failExecution(error: Error) {
        if (!this.state.isRunning()) {
            this.logger.warn('Not changing execution state to fail, because error happened before initialization.');
            return;
        }
        try {
            const execution = this.state.getExecution();
            await this.api.failExecution(execution.id, error);
        } catch (error) {
            this.logger.error('Could not change execution state to fail: ' + error.message, { error });
        }
    }

    async setExecutionSuccess() {
        try {
            const execution = this.state.getExecution();
            await this.api.setExecutionSuccess(execution.id);
        } catch (error) {
            this.logger.error('Could not change execution state to success: ' + error.message, { error });
        }
    }

    async finalize() {
        try {
            await this.engine.finishSession();
            this.browser.detach();
            this.browser.closeAllTabs();
            await this.browser.newTab();
            this.browser.clearInterceptors();
        } catch (error) {
            this.logger.error('Execution finalization failed', { error });
        } finally {
            this.state.clear();
            this.api.clearOrganisationId();
        }
    }

    async connectToBrowser() {
        // Note: we were observing Chrome failing to spawn new tab after a number of executions.
        // This is an attempt at fixing
        try {
            await this.browser.connect();
            await this.browser.openNewTab();
            await this.browser.page.clearBrowsingData();
        } catch (error) {
            // Try launching Chrome again
            this.logger.warn('Connection to browser failed, relaunching Chrome', { error });
            await this.chrome.shutdown();
            await this.chrome.launch();
            await this.browser.connect();
            await this.browser.openNewTab();
            await this.browser.page.clearBrowsingData();
        }
    }

    async initializeScript(execution: Execution): Promise<Script> {
        try {
            const script = await this.scriptCache.getScript(execution.scriptId);
            script.setPlayhead(script.getFirstAction());
            script.$events.on('action.start', (action: Action) => {
                this.logger.debug(`Action start: ${action.type} ${action.label}`);
                this.reporter.sendEvent('debug', 'action.start', {
                    context: action.$context,
                    action,
                });
            });
            script.$events.on('action.end', (action: Action) => {
                this.logger.debug(`Action end: ${action.type} ${action.label}`);
                this.reporter.sendEvent('debug', 'action.end', {
                    context: action.$context,
                    action,
                });
            });
            script.$events.on('context.enter', (context: Context) => {
                const url = this.browser.page.url();
                this.logger.debug(`Context enter: ${context.name}`);
                this.reporter.sendEvent('info', 'context.enter', { context, details: { url } });
            });
            script.$events.on('context.leave', (context: Context) => {
                const url = this.browser.page.url();
                this.logger.debug(`Context leave: ${context.name}`);
                this.reporter.sendEvent('info', 'context.leave', { context, details: { url } });
            });
            return script;
        } catch (error) {
            throw util.createError({
                code: 'BadScript',
                message: 'Could not initialize the script',
                retry: false,
                details: {
                    name: error.name,
                    message: error.message,
                    details: error.details,
                },
            });
        }
    }

    async restoreCheckpoint() {
        const { checkpointId } = this.state.getExecution();
        if (!checkpointId) {
            return;
        }
        try {
            const script = this.state.getScript();
            const checkpointData = await this.api.getCheckpoint(checkpointId);
            await this.checkpoints.restoreCheckpoint(checkpointData);
            const checkpointContext = script.getCheckpointContext();
            const playhead = checkpointContext?.children.first;
            script.setPlayhead(playhead || null);
            this.logger.info('Checkpoint restored');
        } catch (error) {
            this.logger.error('Restore checkpoint failed', { error });
        }
    }
}
