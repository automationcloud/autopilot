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
import { Automation, AutomationMetadata, DEFAULT_AUTOMATION_METADATA } from '../entities/automation';
import { ApiController } from './api';

@injectable()
@controller({ alias: 'acAutomation' })
export class AcAutomationController {

    constructor(
        @inject(ApiController)
        protected api: ApiController
    ) {
    }

    async init() {}

    async getServices() {
        return await this.api.getServices();
    }

    async saveAutomation(): Promise<Automation> {

    }
}
