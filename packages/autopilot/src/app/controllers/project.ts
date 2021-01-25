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

import { UserData } from '../userdata';
import { Script, Engine, ResolverService } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';
import { StorageController } from './storage';
import { controller } from '../controller';
import { EventsController } from '../controllers/events';
import { Automation, DEFAULT_AUTOMATION_METADATA } from '../entities/automation';
import { AutosaveController } from './autosave';
import { promises as fs } from 'fs';
import path from 'path';

@injectable()
@controller({ alias: 'project' })
export class ProjectController {
    userData: UserData;

    automation: Automation;
    initialized: boolean = false;

    constructor(
        @inject(Engine)
        protected engine: Engine,
        @inject(StorageController)
        protected storage: StorageController,
        @inject(ResolverService)
        protected resolver: ResolverService,
        @inject(EventsController)
        protected events: EventsController,
        @inject(AutosaveController)
        protected autosave: AutosaveController,
    ) {
        this.userData = storage.createUserData('project', 300);
        this.automation = {
            metadata: { ...DEFAULT_AUTOMATION_METADATA },
            script: new Script(this.engine, {}),
            bundles: [],
        };
        events.on('scriptInvalidated', () => {
            // Only invalidate after it was already initialized
            if (this.initialized) {
                this.reloadScript();
            }
        });

        events.on('scriptLoaded', () => {
            this.update();
        });
    }

    async init() {
        const { automation = {} } = await this.userData.loadData();
        await this.loadAutomationJson(automation);
        this.initialized = true;
    }

    update() {
        this.userData.update({
            automation: this.automation,
        });
    }

    get script() {
        return this.automation.script;
    }

    // TODO trace those calls and make sure diff bases are accurate in all cases (since we no longer do it here)
    async loadAutomationJson(json: any) {
        await this.autosave.save(this.automation);
        this.automation = {
            metadata: {
                ...DEFAULT_AUTOMATION_METADATA,
                ...json.metadata,
            },
            script: new Script(this.engine, json.script || {}),
            bundles: json.bundles || json.datasets || [],
        };
        // TODO these events are temporary, we'll revisit them alongside dependency management
        this.events.emit('automationLoaded');
        this.events.emit('scriptLoaded');
        this.events.emit('automationMetadataUpdated');
        this.events.emit('feedbackInvalidated');
    }

    reloadScript() {
        const json = JSON.parse(JSON.stringify(this.automation.script));
        this.automation.script = this.initScript(json);
        this.events.emit('scriptLoaded');
        this.events.emit('feedbackInvalidated');
    }

    protected initScript(json: any) {
        const script = new Script(this.engine, json || {});
        // TODO this is "experimental" (in other words, corners cut for rapid prototyping purposes)
        const unmetDeps = [...this.resolver.unmetDependencies(script.dependencies)];
        if (unmetDeps.length) {
            const list = unmetDeps.map(dep => `- ${dep.name}:${dep.version}`).join('\n');
            alert(`Script has following unmet dependencies:\n\n${list}\n\nIt may not work as expected.`);
        }
        return script;
    }

    updateMetadata(json: any) {
        this.automation.metadata = {
            ...DEFAULT_AUTOMATION_METADATA,
            ...json,
        };
    }

    async loadFromAutosave(filename: string) {
        try {
            const file = path.join(this.autosave.autosaveDir, filename);
            const text = await fs.readFile(file, 'utf-8');
            const json = JSON.parse(text);
            await this.loadAutomationJson(json);
        } catch (err) {
            alert('Failed to load autosaved project. See Console for more info.');
            console.error(err);
        }
    }
}
