import { booleanConfig } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';
import { controller } from '../controller';
import { SettingsController } from './settings';

const CLICKS_TO_ACTIVATE = 10;

const DEV_MODE = booleanConfig('DEV_MODE', false);

@injectable()
@controller({ alias: 'devMode' })
export class DevModeController {
    clicks: number = 0;

    constructor(
        @inject(SettingsController)
        protected settings: SettingsController
    ) {}

    async init() {

    }

    isEnabled(): boolean {
        return this.settings.get(DEV_MODE);
    }

    setEnabled(enabled: boolean) {
        this.settings.set(DEV_MODE, enabled);
    }

    registerClick() {
        if (this.isEnabled()) {
            return;
        }
        this.clicks += 1;
        if (this.clicks >= CLICKS_TO_ACTIVATE) {
            this.setEnabled(true);
            this.clicks = 0;
        }
    }

    get remainingClicks() {
        return CLICKS_TO_ACTIVATE - this.clicks;
    }

}
