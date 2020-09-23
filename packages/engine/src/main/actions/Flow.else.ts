// Copyright 2020 UBIO Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
