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
import { Script, booleanConfig, util, Engine } from '@automationcloud/engine';
import { createHash } from 'crypto';
import { inject, injectable } from 'inversify';
import { SettingsController } from './settings';
import { StorageController } from './storage';
import { controller } from '../controller';
import { EventsController } from './events';

const UI_DIFF_ENABLED = booleanConfig('UI_DIFF_ENABLED', true);

@injectable()
@controller({ alias: 'diff', backgroundInit: true })
export class ScriptDiffController {
    userData: UserData;

    objectsMap: Map<string, any> = new Map();

    constructor(
        @inject(Engine)
        protected engine: Engine,
        @inject(StorageController)
        protected storage: StorageController,
        @inject(SettingsController)
        protected settings: SettingsController,
        @inject(EventsController)
        protected events: EventsController,
    ) {
        this.userData = storage.createUserData('diff');
    }

    async init() {
        const { script = {} } = await this.userData.loadData();
        this.buildObjectMap(script);
    }

    isEnabled() {
        return this.settings.get(UI_DIFF_ENABLED);
    }

    getObjectStatus(object: any) {
        if (!this.isEnabled()) {
            return 'unknown';
        }
        const baseObj = this.objectsMap.get(object.id);
        if (!baseObj) {
            return 'added';
        }
        return JSON.stringify(object) === JSON.stringify(baseObj) ? 'up-to-date' : 'modified';
    }

    setNewBase(spec: any) {
        const clone = util.deepClone(spec);
        this.userData.update({
            script: clone,
        });
        this.buildObjectMap(clone);
        this.events.emit('diffBaseSet');
    }

    hashObject(obj: any) {
        const str = JSON.stringify(obj);
        return createHash('sha1')
            .update(str)
            .digest('hex');
    }

    buildObjectMap(spec: Script | any) {
        const script = spec instanceof Script ? spec : new Script(this.engine, spec);
        this.objectsMap = new Map();
        for (const context of script.contexts) {
            this.objectsMap.set(context.id, context);
            for (const action of context.descendentActions()) {
                this.objectsMap.set(action.id, action);
                for (const pipe of action.descendentPipes()) {
                    this.objectsMap.set(pipe.id, pipe);
                }
            }
        }
    }
}
