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

import { booleanConfig } from '@automationcloud/engine';
import { injectable, inject } from 'inversify';
import { controller } from '../controller';
import { SettingsController } from './settings';

const IS_FIRST_RUN = booleanConfig('IS_FIRST_RUN', true);

@injectable()
@controller()
export class FirstRunController {

    constructor(
        @inject(SettingsController)
        protected settings: SettingsController,
    ) {}

    async init() {}

    isFirstRun() {
        return this.settings.get(IS_FIRST_RUN);
    }

    setFirstRun(value: boolean) {
        this.settings.setEntries([['IS_FIRST_RUN', String(value)]]);
    }

}
