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

import { Logger, RegistryService, ResolverService, SessionHandler } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';

@injectable()
@SessionHandler()
export class ExtensionManager {
    constructor(
        @inject(Logger)
        protected logger: Logger,
        @inject(RegistryService)
        protected registry: RegistryService,
        @inject(ResolverService)
        protected resolver: ResolverService,
    ) {}

    async onSessionFinish() {
        // When execution finishes, we refresh the latest versions of extensions,
        // thus keeping latest one in cache for fast access.
        await this.loadAllLatestExtensions();
    }

    async loadAllLatestExtensions() {
        try {
            const index = await this.registry.listExtensions();
            const promises = index.map(m => this.registry.loadExtension(m.name, m.latestVersion));
            await Promise.all(promises);
        } catch (error) {
            this.logger.warn('Failed to load latest extensions', { error });
        }
    }
}
