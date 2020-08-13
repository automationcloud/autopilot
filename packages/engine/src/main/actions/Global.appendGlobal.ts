import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { params } from '../model';

export class AppendGlobalAction extends Action {
    static $type = 'Global.appendGlobal';
    static $icon = 'fas fa-globe';
    static $help = `
Evaluates pipeline and appends resulting values to Global variable, which should contain an array.

If no global with specified key exists yet, creates an empty array before appending to it.
`;

    @params.String({ source: 'globals' })
    key: string = '';

    @params.Pipeline()
    pipeline!: Pipeline;

    async exec() {
        util.assertScript(this.key, 'key is required');
        await this.retry(async () => {
            const els = await this.selectAll(this.pipeline);
            const values = els.map(_ => _.value);
            this.$script.appendGlobal(this.key, values);
        });
    }
}
