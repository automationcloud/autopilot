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
