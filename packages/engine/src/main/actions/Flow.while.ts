import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { params } from '../model';

export class WhileAction extends Action {
    static $type = 'Flow.while';
    static $icon = 'fas fa-sync-alt';
    static $help = `
Loops over child actions while the condition holds \`true\`.

The pipeline should resolve to a single element with boolean value.
If the value is \`true\`, the control is passed to children, otherwise the children are skipped.
After last child is executed, the control is passed back to While so that the condition could be checked again.

The scope of children is not modified by this pipeline (children will receive the scope from the parent of this action).

### Parameters

- limit: maximum number of iterations allowed (to prevent endless loops)

### Use For

- creating general purpose loops which execute actions whilst the condition is met
  (e.g. click button until something happens)
`;

    @params.Pipeline()
    pipeline!: Pipeline;
    @params.Number({ min: 0 })
    limit: number = 10;

    $attempts: number = 0;

    reset() {
        super.reset();
        this.$attempts = 0;
    }

    hasChildren() {
        return true;
    }

    async exec() {
        util.assertPlayback(this.$attempts <= this.limit, 'While loop limit exceeded');
        const condition = await this.retry(async () => {
            const el = await this.selectSingle(this.pipeline, false);
            const condition = el!.value;
            util.checkType(condition, 'boolean');
            return condition;
        });
        this.$runtime.bypassed = !condition;
        this.$attempts += 1;
    }

    afterRun() {
        if (this.$runtime.bypassed) {
            this.skip();
        } else {
            this.enter();
        }
    }

    leave() {
        this.$script.setPlayhead(this);
    }
}
