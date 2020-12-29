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

import { ResolverService } from '@automationcloud/engine';
import { injectable, inject } from 'inversify';
import { EventBus } from '../event-bus';
import { controller } from '../controller';
import { ExtensionDevController } from './extension-dev';
import { ExtensionRegistryController } from './extension-registry';

/**
 * Makes sure extensions are loaded in a consistent manner, that is,
 * development extensions taking precedence over installed ones.
 */
@injectable()
@controller({ priority: 1000 })
export class ExtensionLoaderController {

    constructor(
        @inject(EventBus)
        protected events: EventBus,
        @inject(ResolverService)
        protected resolver: ResolverService,
        @inject(ExtensionDevController)
        protected extDev: ExtensionDevController,
        @inject(ExtensionRegistryController)
        protected extReg: ExtensionRegistryController,
    ) {
        this.events.on('extensionsUpdated', () => this.reloadExtensionsSync());
    }

    async init() {
        this.reloadExtensionsSync();
    }

    reloadExtensionsSync() {
        const extensions = [
            ...this.extReg.installedExtensions,
            // Dev extensions take priority over installed ones
            ...this.extDev.extensions,
        ];
        this.resolver.purgeExtensions();
        for (const ext of extensions) {
            this.resolver.addExtension(ext);
        }
        this.events.emit('scriptInvalidated');
    }

}
