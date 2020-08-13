import { Action } from './action';
import { Pipeline } from './pipeline';
import { params } from './model';
import * as util from './util';
import { Exception } from '@automationcloud/cdp';

export class MatcherAction extends Action {
    static $type = 'matcher';
    static $icon = 'fas fa-check';
    static $hidden = true;

    @params.Pipeline()
    pipeline!: Pipeline;

    async performMatch(): Promise<void> {
        await this._trackRuntimeStats(() => this.performCheck());
    }

    async exec() {
        await this.performCheck();
    }

    async performCheck() {
        const el = await this.selectSingle(this.pipeline, false);
        util.checkType(el!.value, 'boolean');
        if (!el!.value) {
            throw new Exception({
                name: 'MatchFailed',
                message: 'Matcher failed to match',
                retry: false,
            });
        }
    }
}
