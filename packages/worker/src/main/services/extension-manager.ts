import { RegistryService, ResolverService, SessionHandler, Logger } from '@automationcloud/engine';
import { injectable, inject } from 'inversify';

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

    async onSessionStart() {}

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
