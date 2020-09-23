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

import { BrowserService, Configuration, Logger } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';
import { controller } from '../controller';

@injectable()
@controller()
export class AutopilotBrowserService extends BrowserService {
    constructor(
        @inject(Configuration)
        config: Configuration,
        @inject(Logger)
        logger: Logger,
    ) {
        super(logger, config);
        this.on('attached', () => this.page.domManager.enable());
    }

    async init() {
    }
}
