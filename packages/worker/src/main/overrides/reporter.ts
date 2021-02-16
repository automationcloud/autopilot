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

import {
    Logger,
    Configuration,
    ReporterService,
    ScreenshotSpec,
    Page,
    BrowserService,
    EventData,
    ReportingLevel,
    stringConfig,
} from '@automationcloud/engine';
import { Execution } from '../types';
import { inject } from 'inversify';
import { WorkerState } from '../services/state';
import { ApiService } from '../services/api';

const DEFAULT_SCREENSHOT_LEVEL = stringConfig('DEFAULT_SCREENSHOT_LEVEL', 'info');
const DEFAULT_HTML_SNAPSHOT_LEVEL = stringConfig('DEFAULT_HTML_SNAPSHOT_LEVEL', 'info');
const DEFAULT_EVENT_LEVEL = stringConfig('DEFAULT_EVENT_LEVEL', 'debug');

export class WorkerReporterService extends ReporterService {
    constructor(
        @inject(WorkerState)
        protected state: WorkerState,
        @inject(Logger)
        protected logger: Logger,
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(Configuration)
        protected config: Configuration,
        @inject(ApiService)
        protected api: ApiService,
    ) {
        super();
    }

    // Screenshots

    isScreenshotEnabled(level: ReportingLevel) {
        const execution = this.state.execution;
        if (!execution) {
            this.logger.warn('Not sending screenshot, because execution is not yet initialized');
            return false;
        }
        // TODO backwards compat, to be removed
        const isDebugScreenshotsEnabled = execution.options?.screenshot;
        if (isDebugScreenshotsEnabled) {
            return 'debug';
        }
        const desired = execution.options?.screenshotLevel || this.config.get(DEFAULT_SCREENSHOT_LEVEL);
        return this.checkLevel(level, desired as ReportingLevel);
    }

    async sendScreenshot(level: ReportingLevel, options: ScreenshotSpec = {}): Promise<void> {
        const enabled = this.isScreenshotEnabled(level);
        if (!enabled) {
            return;
        }
        const execution = this.state.getExecution();
        await this.sendScreenshotInPage(execution, this.browser.page, options);
    }

    private async sendScreenshotInPage(execution: Execution, page: Page, options: ScreenshotSpec) {
        try {
            const script = this.state.getScript();
            const action = script.$playback.playhead;
            const context = action ? action.$context : null;
            const { width, height, imageData } = options.fullPage
                ? await page.screenshotManager.captureFullPage(options)
                : await page.screenshotManager.captureViewport(options);
            await this.api.createScreenshot(execution.id, this.state.getInfo(), {
                title: options.label,
                imageData,
                mimeType: 'image/png',
                action,
                context,
                fullPage: options.fullPage,
                isPublic: options.isPublic,
                width,
                height,
            });
        } catch (error) {
            this.logger.warn('Screenshot error', { error });
        }
    }

    // HTML Snapshots

    isHtmlSnapshotEnabled(level: ReportingLevel) {
        const execution = this.state.execution;
        if (!execution) {
            this.logger.warn('Not sending snapshot, because execution is not yet initialized');
            return false;
        }
        // TODO backwards compat, to be removed
        const isDebugSnapshotEnabled = execution.options?.htmlSnapshot;
        if (isDebugSnapshotEnabled) {
            return 'debug';
        }
        const desired = execution.options?.htmlSnapshotLevel || this.config.get(DEFAULT_HTML_SNAPSHOT_LEVEL);
        return this.checkLevel(level, desired as ReportingLevel);
    }

    async sendHtmlSnapshot(level: ReportingLevel): Promise<void> {
        if (!this.isHtmlSnapshotEnabled(level)) {
            return;
        }
        try {
            const script = this.state.getScript();
            const execution = this.state.getExecution();
            const action = script.$playback.playhead;
            const context = action ? action.$context : null;
            const page = this.browser.page;
            await page.target.refreshInfo();
            const { url, title } = page.target;
            const html = await page.captureHtmlSnapshot();
            await this.api.createHtmlSnapshot(execution.id, this.state.getInfo(), {
                title,
                url,
                html,
                action,
                context,
            });
        } catch (error) {
            this.logger.warn('HTML snapshot failed', { error });
        }
    }

    // Execution Events

    isEventEnabled(level: ReportingLevel) {
        const execution = this.state.execution;
        if (!execution) {
            return false;
        }
        const desired = this.config.get(DEFAULT_EVENT_LEVEL);
        return this.checkLevel(level, desired as ReportingLevel);
    }

    async sendEvent(level: ReportingLevel, eventName: string, eventData: EventData = {}): Promise<void> {
        if (!this.isEventEnabled(level)) {
            return;
        }
        try {
            const execution = this.state.getExecution();
            await this.api.createExecutionEvent(execution.id, {
                namespace: 'playback',
                name: eventName,
                details: eventData.details || {},
                action: eventData.action,
                context: eventData.context,
            });
        } catch (error) {
            this.logger.error('sendEvent failed', { error });
        }
    }
}
