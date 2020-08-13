import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { params } from '../model';

export class DynamicOutput extends Action {
    static $type = 'Flow.dynamicOutput';
    static $icon = 'fas fa-share';
    static $help = `
Sends a dynamic Job Output, with both \`key\` and \`data\` being evaluated at runtime
rather than pre-defined at scripting time.

The pipeline should return a single element with \`key: string\` and \`data: any\`.
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    @params.Preview({
        label: 'Output Preview',
        placeholder: 'Run the action to preview the output value.',
    })
    $output: any = undefined;

    // For preview validation
    $outputKey: string = '';

    reset() {
        super.reset();
        this.$output = undefined;
        this.$outputKey = '';
    }

    async exec() {
        await this.retry(async () => {
            const el = await this.selectOne(this.pipeline);
            util.checkType(el.value, 'object', 'value');
            const { key, data } = el.value;
            util.assertPlayback(!!key, 'Key should be a non-empty string');
            util.assertPlayback(data !== undefined, 'Data should exist');
            util.checkType(key, 'string', 'value.key');
            this.$output = data;
            this.$outputKey = this.$script.hashInputOutputKey(key);
            await this.$script.sendOutput(key, data)
        });
    }
}
