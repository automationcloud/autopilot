import uuid from 'uuid';
import os from 'os';
import path from 'path';
import { helpers } from '../util';
import { BrowserService, CheckpointService } from '@automationcloud/engine';
import { injectable, inject } from 'inversify';
import { controller } from '../controller';
import { EventBus } from '../event-bus';
import { ProjectController } from './project';
import { ApiController } from './api';
import { PlaybackManager } from '../managers/playback-manager';
import { ScriptDiffController } from './script-diff';
import { DatasetsController } from './datasets';

@injectable()
@controller()
export class ToolsController {

    // TODO split away!
    constructor(
        @inject(EventBus)
        protected events: EventBus,
        @inject(ProjectController)
        protected project: ProjectController,
        @inject(ScriptDiffController)
        protected diff: ScriptDiffController,
        @inject(ApiController)
        protected api: ApiController,
        @inject(BrowserService)
        protected browser: BrowserService,
        @inject(DatasetsController)
        protected datasets: DatasetsController,
        @inject(PlaybackManager)
        protected playback: PlaybackManager,
        @inject(CheckpointService)
        protected checkpoints: CheckpointService,
    ) {}

    async init() {}

    get script() { return this.project.script; }

    // Loaders

    async loadScriptService(scriptId: string, serviceId: string) {
        const service = await this.api.getService(serviceId);
        const scriptData = await this.api.getScriptData(scriptId);
        await this.project.loadFromJson(scriptData);
        this.project.metadata.domainId = service.domain;
        this.project.metadata.scriptId = scriptId;
        this.project.metadata.serviceId = serviceId;
        this.events.emit('serviceUpdated');
    }

    async loadScriptAsDiffBase(scriptId: string) {
        const scriptData = await this.api.getScriptData(scriptId);
        this.diff.setNewBase(scriptData.script);
    }

    async loadHtmlSnapshot(htmlSnapshotId: string) {
        const snapshot = await this.api.getHtmlSnapshot(htmlSnapshotId);
        const { html } = snapshot;
        const tempFile = path.resolve(os.tmpdir(), `autopilot-${uuid.v4()}.html`);
        await helpers.writeFileAsync(tempFile, html, 'utf-8');
        await this.browser.page.navigate(`file://${tempFile}`);
    }

    async loadJobData(jobId: string) {
        const jobInputs = await this.api.getJobInputs(jobId);
        const inputs = jobInputs.map(d => {
            return {
                key: d.key,
                stage: d.stage || '',
                data: d.data,
            };
        });
        this.datasets.createDataset({
            name: 'Job #' + jobId.substring(0, 7),
            inputs,
            excluded: true,
        });
        this.datasets.selectDataset();
        this.datasets.update();
    }

    async loadCheckpoint(checkpointId: string) {
        const { url, title, data = {} } = await this.api.getCheckpoint(checkpointId);
        const checkpoint = {
            url,
            title,
            method: data.method || 'get',
            cookies: data.cookies || [],
            postParams: data.postParams || [],
            localStorage: data.localStorage || [],
            sessionStorage: data.sessionStorage || [],
            globals: data.globals || [],
        };

        await this.playback.reset();
        await this.checkpoints.restoreCheckpoint(checkpoint);
    }

    async saveHtmlSnapshot() {
        const filePath = await helpers.showSaveDialog({
            title: 'Save HTML Snapshot',
            filters: [
                { name: 'HTML File', extensions: ['html'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });
        if (filePath == null) {
            return;
        }
        const html = await this.browser.page.grabHtmlSnapshot();
        await helpers.writeFileAsync(filePath, html);
    }

    async testCheckpoint() {
        const checkpoint = await this.checkpoints.createCheckpoint('test');
        console.info('Checkpoint', checkpoint);
        await this.playback.reset();
        await this.checkpoints.restoreCheckpoint(checkpoint);
        const checkpointCtx = this.script.getCheckpointContext();
        if (checkpointCtx) {
            this.script.setPlayhead(checkpointCtx.children.first);
        }
    }

}
