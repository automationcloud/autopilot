import { booleanConfig } from '@automationcloud/engine';
import { inject, injectable } from 'inversify';

import { controller } from '../controller';
import { SettingsController } from './settings';

const UI_PIPE_FEEDBACK_ENABLED = booleanConfig('UI_PIPE_FEEDBACK_ENABLED', true);

@injectable()
@controller({
    alias: 'scriptEditor',
})
export class ScriptEditorController {

    constructor(
        @inject(SettingsController)
        protected settings: SettingsController,
    ) {

    }

    async init() {}

    isPipeFeedbackEnabled() {
        return this.settings.get(UI_PIPE_FEEDBACK_ENABLED);
    }

}
