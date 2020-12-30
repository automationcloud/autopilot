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

import { inject, injectable } from 'inversify';
import { controller } from '../controller';
import { promises as fs } from 'fs';
import path from 'path';
import { StorageController } from './storage';
import moment from 'moment';
import rimraf from 'rimraf';
import { promisify } from 'util';
import { ProjectController } from './project';
import { EventsController } from '../controllers/events';

const rimrafAsync = promisify(rimraf);

@injectable()
@controller()
export class AutosaveController {

    files: string[] = [];
    limit: number = 50;

    constructor(
        @inject(StorageController)
        protected storage: StorageController,
        @inject(ProjectController)
        protected project: ProjectController,
        @inject(EventsController)
        protected events: EventsController,
    ) {
        this.events.on('writeAutosave', () => this.saveCurrent());
    }

    async init() {
        await fs.mkdir(this.autosaveDir, { recursive: true });
        const files = (await fs.readdir(this.autosaveDir))
            .filter(_ => _.endsWith('.json'));
        const stats = await Promise.all(files.map(f => fs.stat(path.join(this.autosaveDir, f))));
        this.files = files
            .map((filename, i) => {
                return {
                    filename,
                    mtime: stats[i].mtime.getDate(),
                };
            })
            .sort((f1, f2) => (f1.mtime > f2.mtime ? 1 : -1))
            .map(f => f.filename);
    }

    get autosaveDir() {
        return this.storage.getFilename('autosave');
    }

    async saveCurrent() {
        const state = this.project.automation;
        const newFile =
            moment.utc().format('YYYY-MM-DD_HH-mm-ss_SSS_') +
            state.script.name.toLowerCase().replace(/[^a-z0-9]/g, '-') +
            '.json';
        await fs.mkdir(this.autosaveDir, { recursive: true });
        await fs.writeFile(path.join(this.autosaveDir, newFile), JSON.stringify(state), 'utf-8');
        await this.pruneAutosave();
    }

    async pruneAutosave() {
        await this.init();
        const toRemove = this.files.slice(this.limit);
        for (const file of toRemove) {
            console.info('Removing old autosave file', file);
            await rimrafAsync(path.join(this.autosaveDir, file));
        }
    }

    async restore(filename: string) {
        try {
            const file = path.join(this.autosaveDir, filename);
            const text = await fs.readFile(file, 'utf-8');
            const json = JSON.parse(text);
            await this.saveCurrent();
            await this.project.loadAutomationJson(json);
        } catch (err) {
            alert('Failed to load autosaved project. See Console for more info.');
            console.error(err);
        }
    }

}
