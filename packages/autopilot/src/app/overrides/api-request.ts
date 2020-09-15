import { ApiRequest, Configuration } from '@automationcloud/engine';
import { inject } from 'inversify';
import { EventBus } from '../event-bus';

export class AutopilotApiRequest extends ApiRequest {

    constructor(
        @inject(Configuration)
        protected config: Configuration,
        @inject(EventBus)
        protected events: EventBus,
    ) {
        super(config);
        this.events.on('settingsReady', () => this.setup());
        this.events.on('settingsUpdated', () => this.setup());
    }

    setup() {
        super.setup();
        this.request.on('retry', (error, info) => {
            console.debug('API request failed, retrying', info, error);
        });
        // this.request.on('beforeSend', info => console.debug(info.method, info.url, info.headers));
    }

}
