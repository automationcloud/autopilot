import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { params } from '../model';

export class FlowOutput extends Action {
    static $type = 'Flow.output';
    static $icon = 'fas fa-share';
    static $help = `
Sends Job Output with specified Output Key.

The pipeline should return a single element.
Its value will be sent as output data.

Note: multiple elements are not automatically serialized to arrays;
use Fold Array to send arrays instead.

### Parameters

- output key
`;

    @params.String({ source: 'outputs' })
    outputKey: string = '';

    @params.Pipeline()
    pipeline!: Pipeline;

    @params.Preview({
        label: 'Output Preview',
        placeholder: 'Run the action to preview the output value.',
        outputKeyProp: 'outputKey',
    })
    $output: any = undefined;

    getLabel() {
        return this.outputKey;
    }

    reset() {
        super.reset();
        this.$output = undefined;
    }

    *collectOutputKeys(): IterableIterator<string> {
        yield this.outputKey;
    }

    async exec() {
        util.assertScript(this.outputKey, 'Output key is not specified');
        await this.retry(async () => {
            const el = await this.selectOne(this.pipeline);
            this.$output = el.value;
            await this.$script.sendOutput(this.outputKey, el.value);
        });
    }
}
