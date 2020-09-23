// Copyright 2020 Ubio Limited
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

import { App } from '../app';
import { clipboard, helpers } from '../util';
import { Controller } from '../controller';

export type LoaderResourceType = 'none' | 'service' | 'script' | 'job' | 'execution' | 'html-snapshot' | 'uuid';

const urlPrefixes: Array<{ type: LoaderResourceType; prefix: string }> = [
    { type: 'service', prefix: 'services' },
    { type: 'script', prefix: 'scripts' },
    { type: 'job', prefix: 'jobs' },
    { type: 'execution', prefix: 'executions' },
    { type: 'html-snapshot', prefix: 'html-snapshots' },
];

export class ClipboardLoaderController implements Controller {
    app: App;

    loading: boolean = false;
    resourceType: LoaderResourceType = 'none';
    resourceId: string = '';

    constructor(app: App) {
        this.app = app;
    }

    async init() {}

    refresh() {
        this.resourceType = 'none';
        this.resourceId = '';
        const url = clipboard.getUrl();
        if (!url) {
            const text = clipboard.readText().trim();
            const uuid = helpers.isUuid(text);
            if (uuid) {
                this.resourceType = 'uuid';
                this.resourceId = text;
            }
            return;
        }
        const { pathname } = url;
        for (const { type, prefix } of urlPrefixes) {
            const r = new RegExp(`/${prefix}/([0-9a-f]*(?:-[0-9a-f]+)*)(?=/|$)`, 'gi');
            const m = r.exec(pathname);
            if (m && m[1]) {
                this.resourceType = type;
                this.resourceId = m[1];
                return;
            }
        }
    }

    canLoadScript() {
        return ['service', 'script', 'job', 'execution', 'html-snapshot'].includes(this.resourceType);
    }

    canLoadJobData() {
        return ['job', 'execution', 'html-snapshot'].includes(this.resourceType);
    }

    canLoadHtmlSnapshot() {
        return ['html-snapshot'].includes(this.resourceType);
    }

    canLoadBundle() {
        return ['job', 'execution', 'html-snapshot'].includes(this.resourceType);
    }

    canLoadLatestCheckpoint() {
        return ['execution'].includes(this.resourceType);
    }

    canLoadCheckpointById() {
        return ['uuid'].includes(this.resourceType);
    }

    async loadScript() {
        this.loading = true;
        try {
            switch (this.resourceType) {
                case 'script': {
                    const script = await this.app.api.getScript(this.resourceId);
                    await this.app.tools.loadScriptService(script.id, script.serviceId);
                    break;
                }
                case 'service': {
                    const service = await this.app.api.getService(this.resourceId);
                    await this.app.tools.loadScriptService(service.scriptId, service.id);
                    break;
                }
                case 'job': {
                    const job = await this.app.api.getJob(this.resourceId);
                    await this.app.tools.loadScriptService(job.scriptId, job.serviceId);
                    break;
                }
                case 'execution': {
                    const execution = await this.app.api.getExecution(this.resourceId);
                    await this.app.tools.loadScriptService(execution.scriptId, execution.serviceId);
                    break;
                }
                case 'html-snapshot': {
                    const htmlSnapshot = await this.app.api.getHtmlSnapshot(this.resourceId);
                    const script = await this.app.api.getScript(htmlSnapshot.scriptId);
                    await this.app.tools.loadScriptService(script.id, script.serviceId);
                    break;
                }
                default:
                    return;
            }
            this.app.viewports.scriptFlow.activateViewport();
        } catch (err) {
            alert('Could not load Script. Please see Console for details.');
            console.error(err);
        } finally {
            this.loading = false;
        }
    }

    async loadJobData() {
        this.loading = true;
        try {
            switch (this.resourceType) {
                case 'job': {
                    await this.app.tools.loadJobData(this.resourceId);
                    break;
                }
                case 'execution': {
                    const execution = await this.app.api.getExecution(this.resourceId);
                    await this.app.tools.loadJobData(execution.jobId);
                    break;
                }
                case 'html-snapshot': {
                    const htmlSnapshot = await this.app.api.getHtmlSnapshot(this.resourceId);
                    await this.app.tools.loadJobData(htmlSnapshot.jobId);
                    break;
                }
                default:
                    return;
            }
            this.app.viewports.datasets.activateViewport();
        } catch (err) {
            alert('Could not load Job Data. Please see Console for details.');
            console.error(err);
        } finally {
            this.loading = false;
        }
    }

    async loadHtmlSnapshot() {
        this.loading = true;
        try {
            switch (this.resourceType) {
                case 'html-snapshot': {
                    await this.app.tools.loadHtmlSnapshot(this.resourceId);
                    break;
                }
                default:
                    return;
            }
        } catch (err) {
            alert('Could not load Html Snapshot. Please see Console for details.');
            console.error(err);
        } finally {
            this.loading = false;
        }
    }

    async loadCheckpoint() {
        this.loading = true;
        try {
            switch (this.resourceType) {
                case 'execution': {
                    const options = { executionId: this.resourceId, limit: 1 };
                    const [latest] = await this.app.api.getCheckpoints(options);
                    if (!latest) {
                        throw new Error('Checkpoint not found');
                    }
                    await this.app.tools.loadCheckpoint(latest.id);
                    break;
                }
                case 'uuid': {
                    await this.app.tools.loadCheckpoint(this.resourceId);
                    break;
                }
                default:
                    return;
            }
        } catch (err) {
            alert('Could not load Checkpoint. Please see Console for details.');
            console.error(err);
        } finally {
            this.loading = false;
        }
    }

    async loadBundle() {
        await this.loadScript();
        await this.loadJobData();
        await this.loadHtmlSnapshot();
    }

    *buildMenu() {
        this.refresh();
        yield {
            label: 'Load Script',
            enabled: this.canLoadScript(),
            click: () => this.loadScript()
        };
        yield {
            label: 'Load Job Inputs',
            enabled: this.canLoadJobData(),
            click: () => this.loadJobData()
        };
        yield {
            label: 'Load HTML Snapshot',
            enabled: this.canLoadHtmlSnapshot(),
            click: () => this.loadHtmlSnapshot()
        };
        yield {
            label: 'Load Bundle',
            enabled: this.canLoadBundle(),
            click: () => this.loadBundle(),
        };
        yield { type: 'separator' };
        yield {
            label: 'Load Latest Checkpoint',
            enabled: this.canLoadLatestCheckpoint(),
            click: () => this.loadCheckpoint()
        };
        yield {
            label: 'Load Checkpoint by Id',
            enabled: this.canLoadCheckpointById(),
            click: () => this.loadCheckpoint()
        };
    }

}
