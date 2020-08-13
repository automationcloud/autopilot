import { Action } from '../action';
import * as util from '../util';
import { collectIfElseChain } from './Flow.if';

export class ElseAction extends Action {
    static $type = 'Flow.else';
    static $icon = 'fas fa-question';
    static $help = `
Passes control flow to the children only if neither one of the preceeding If or Else If actions were entered.

This action must be placed next to either If or another Else If action.
All adjacent If, Else If and Else actions form a single chain with a guarantee that at most one branch is entered.

### Use For

- general purpose branching and conditional execution
`;

    hasChildren() {
        return true;
    }

    async exec() {
        const chain = this.getChain();
        util.assertScript(chain.length, 'else must immediately follow if or else-if');
        for (const action of chain) {
            util.assertPlayback(
                action.$runtime.bypassed != null,
                'Cannot execute else: previous actions need to be executed first',
            );
            if (!action.$runtime.bypassed) {
                this.$runtime.bypassed = true;
                return;
            }
        }
        this.$runtime.bypassed = false;
    }

    afterRun() {
        if (this.$runtime.bypassed) {
            this.skip();
        } else {
            this.enter();
        }
    }

    getChain() {
        return Array.from(collectIfElseChain(this));
    }
}
