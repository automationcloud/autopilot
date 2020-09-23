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

import { Viewport } from '../../viewport';
import path from 'path';
import os from 'os';
import ms from 'ms';
import { App } from '../../app';
import { helpers } from '../../util';
import { ScriptSearchQuery, Script, ScriptSearchResult, Action, Context } from '@automationcloud/engine';
import { ApiService } from '../../controllers/api';
import csvStringify from 'csv-stringify/lib/sync';

export interface SearchScriptsState {
    queries: ScriptSearchQuery[];
}

export interface ServiceSearchResult {
    serviceId: string;
    serviceName: string;
    scriptId: string;
    nodes: ScriptSearchResult[];
}

export class SearchScriptsViewport extends Viewport<SearchScriptsState> {
    cacheDir: string;
    loading: boolean = false;
    services: ApiService[] = [];
    searching: boolean = false;
    results: ServiceSearchResult[] = [];
    statusText: string = '';

    constructor(app: App) {
        super(app);
        this.cacheDir = path.resolve(os.homedir(), '.autopilot', 'cache', 'scripts');
        helpers.mkdirpAsync(this.cacheDir).catch(err => console.error('Failed to create cache directory', err));
    }

    getViewportId(): string {
        return 'search-scripts';
    }

    getViewportName(): string {
        return 'Search Scripts';
    }

    getViewportIcon(): string {
        return 'fas fa-search';
    }

    getDefaultState(): SearchScriptsState {
        return {
            queries: [
                {
                    type: 'pipe',
                    props: {
                        type: ['value/get-input', 'value/get-input-stage'],
                        inputKey: ['selectedOutboundFlight', 'selectedInboundFlight'],
                    },
                },
            ],
        };
    }

    async fetchServices() {
        this.services = await this.app.api.getServices({
            archived: false,
            limit: 1000,
        });
    }

    getQueries(): ScriptSearchQuery[] {
        return this.getState().queries;
    }

    setQueries(queries: ScriptSearchQuery[]) {
        this.applyState({ queries });
    }

    async loadScript(scriptId: string) {
        const file = path.resolve(this.cacheDir, scriptId + '.json');
        try {
            const text = await helpers.readFileAsync(file, 'utf-8');
            const json = helpers.parseJson(text);
            return new Script(this.app, json);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
            const { script } = await this.app.api.getScriptData(scriptId);
            await helpers.writeFileAsync(file, JSON.stringify(script), 'utf-8');
            return new Script(this.app, script);
        }
    }

    stopSearch() {
        this.searching = false;
    }

    startSearch() {
        this.searchInServices(this.services).catch(err => console.error('Search failed', err));
    }

    async searchInServices(services: ApiService[]) {
        if (this.searching) {
            return;
        }
        this.results = [];
        this.searching = true;
        this.statusText = '';
        const startedAt = Date.now();
        let count = 0;
        for (const service of services) {
            if (!this.searching) {
                break;
            }
            try {
                if (!service.scriptId) {
                    continue;
                }
                this.statusText = `Searching in ${service.name}`;
                const script = await this.loadScript(service.scriptId);
                const buckets: Map<string, ServiceSearchResult> = new Map();
                for (const node of script.search(this.getQueries(), { returnPipes: false })) {
                    count += 1;
                    const bucket = buckets.get(service.id);
                    if (bucket) {
                        bucket.nodes.push(node);
                    } else {
                        const bucket = {
                            serviceId: service.id,
                            serviceName: service.name,
                            scriptId: service.scriptId,
                            nodes: [node],
                        };
                        buckets.set(service.id, bucket);
                        this.results.push(bucket);
                    }
                }
            } catch (err) {
                console.error('Search failed', service, err);
            }
        }
        this.searching = false;
        const duration = Date.now() - startedAt;
        this.statusText = `Found ${count} nodes in ${this.results.length} services in ${ms(duration)}`;
    }

    async exportCsv() {
        const filePath = await helpers.showSaveDialog({
            title: 'Save results as CSV',
            filters: [
                { name: 'CSV Files', extensions: ['csv'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });
        if (filePath == null) {
            return;
        }
        const header = ['Script', 'Context', 'Action'];
        const records: Array<[string, string, string]> = [];
        for (const result of this.results) {
            for (const node of result.nodes) {
                const name = node instanceof Action ? node.label :
                    node instanceof Context ? node.name : node.type;
                records.push([result.serviceName, node.$context.name, name]);
            }
        }
        const csv = csvStringify([header].concat(records));
        await helpers.writeFileAsync(filePath, csv, 'utf-8');
    }
}
