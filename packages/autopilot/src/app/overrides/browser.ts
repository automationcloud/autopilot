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
