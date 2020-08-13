import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { params } from '../model';

export class IfAction extends Action {
    static $type = 'Flow.if';
    static $icon = 'fas fa-question';
    static $help = `
Conditionally passes control to children, based on the pipeline result.

The pipeline which should return a single element with boolean value.
If the value is \`true\`, then the control is passed to the children, otherwise child actions are bypassed.

The scope of children is not modified by this pipeline (children will receive the scope from the parent of this action).

### Use For

- general purpose branching and conditional execution
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    hasChildren() {
        return true;
    }

    async exec() {
        await this.retry(async () => {
            const el = await this.selectSingle(this.pipeline, false);
            const condition = el!.value;
            util.checkType(condition, 'boolean');
            this.$runtime.bypassed = !condition;
        });
    }

    afterRun() {
        if (this.$runtime.bypassed) {
            this.skip();
        } else {
            this.enter();
        }
    }
}

export function* collectIfElseChain(action: Action): IterableIterator<Action> {
    for (const sib of action.previousSiblings()) {
        if (sib.type === 'Flow.if') {
            yield sib;
            return;
        } else if (sib.type === 'Flow.elseIf') {
            yield sib;
        } else {
            return;
        }
    }
}
