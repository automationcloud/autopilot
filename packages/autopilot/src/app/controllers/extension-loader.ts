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
        this.events.emit('projectInvalidated');
    }

}
