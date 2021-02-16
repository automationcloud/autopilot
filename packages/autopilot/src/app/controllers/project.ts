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
import { Script, Engine, ResolverService, ExtensionVersion, ExtensionUnmetDep } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';
import { StorageController } from './storage';
import { controller } from '../controller';
import { EventsController } from '../controllers/events';
import { Automation, DEFAULT_AUTOMATION_METADATA } from '../entities/automation';
import { AutosaveController } from './autosave';
import { promises as fs } from 'fs';
import path from 'path';
import { NotificationsController } from './notifications';
import semver from 'semver';

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
        @inject(NotificationsController)
        protected notifications: NotificationsController,
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
            script: this.initScript(json.script || {}),
            bundles: json.bundles || json.datasets || [],
        };
        this.update();
        // TODO these events are temporary, we'll revisit them alongside dependency management
        this.events.emit('automationLoaded');
        this.events.emit('automationMetadataUpdated');
        this.events.emit('feedbackInvalidated');
    }

    reloadScript() {
        const json = JSON.parse(JSON.stringify(this.automation.script));
        this.automation.script = this.initScript(json);
        this.events.emit('feedbackInvalidated');
    }

    protected initScript(json: any) {
        const script = new Script(this.engine, json || {});
        const unmetDeps = [...this.resolver.unmetDependencies(script.dependencies)];
        const missingDeps = unmetDeps.filter(_ => _.existingVersion == null);
        const unsatisfiedDeps = unmetDeps.filter(_ => _.existingVersion != null);
        if (missingDeps.length) {
            this.notifyMissingDeps(missingDeps);
        }
        if (unsatisfiedDeps.length) {
            this.notifyUnsatisfiedDeps(unsatisfiedDeps);
        }
        return script;
    }

    protected notifyMissingDeps(missingDeps: ExtensionUnmetDep[]) {
        const title = missingDeps.length === 1 ?
            `This script requires extension ${missingDeps[0].name}` :
            `This script needs ${missingDeps.length} missing extensions`;
        const message = missingDeps.length === 1 ?
            'Without it the script may not function correctly.' :
            'Without the extensions it may not function correctly.';
        this.notifications.add({
            id: 'script.missingDep',
            level: 'info',
            title,
            message,
            primaryAction: {
                title: 'Install',
                action: () => {
                    this.installDeps(missingDeps);
                    this.notifications.removeById('script.missingDep');
                },
            },
            secondaryAction: {
                title: 'Cancel',
                action: () => this.notifications.removeById('script.missingDep'),
            }
        });
    }

    protected notifyUnsatisfiedDeps(unsatisfiedDeps: ExtensionUnmetDep[]) {
        for (const dep of unsatisfiedDeps) {
            const coerced = semver.coerce(dep.version)?.version;
            if (!coerced) {
                console.warn(`Could not understand dependency, skipping`, dep);
                continue;
            }
            const isNewer = semver.gt(coerced, dep.existingVersion!);
            const title = isNewer ?
                `The script uses newer version of ${dep.name}` :
                `The script uses older version of ${dep.name}`;
            const message = `You have v${dep.existingVersion} installed. ` +
                `The script was created with v${coerced}. ` +
                `Without it the script may not function correctly or may need editing.`;
            this.notifications.add({
                id: `script.deps.${dep.name}`,
                level: 'info',
                title,
                message,
                primaryAction: {
                    title: 'Install',
                    action: () => {
                        this.notifications.removeById(`script.deps.${dep.name}`);
                        this.installDeps([dep]);
                    },
                },
                secondaryAction: {
                    title: 'Cancel',
                    action: () => this.notifications.removeById(`script.deps.${dep.name}`),
                }
            });
        }
    }

    protected installDeps(deps: ExtensionVersion[]) {
        for (const dep of deps) {
            this.events.emit('extensionRequested', dep);
        }
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
