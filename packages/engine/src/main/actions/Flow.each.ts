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
import { Element } from '../element';
import { params } from '../model';
import { Pipeline } from '../pipeline';
import * as util from '../util';

export class EachAction extends Action {
    static $type = 'Flow.each';
    static $icon = 'fas fa-list';
    static $help = `
Iterates over a set of elements, passing control to children and modifying their scope.

The pipeline should resolve to a list of elements.
On every run the internal index is incremented, and the element at current index becomes the scope of children.

After last child is executed, the control is passed back to Each.
Each exits when there are no more elements left to iterate over.

Note: every time the children are executed the scope is re-evaluated;
specifically, if scope element disappears (or some other pipeline failure occurs),
then children won't be able to execute.

### Use For

- iterating over web page elements (e.g. passenger forms)
- executing actions per each item of the array
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    $iteration: number | null = null;

    reset() {
        super.reset();
        this.$iteration = null;
    }

    hasChildren() {
        return true;
    }

    async resolveChildrenScope() {
        const el = await this.getCurrentElement();
        util.assertPlayback(el, 'No iteration scope');
        return [el!];
    }

    async exec() {
        this.nextIndex();
        const el = await this.getCurrentElement();
        this.$runtime.bypassed = !el;
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

    async getCurrentElement(): Promise<Element | null> {
        const elements = await this.retry(() => this.selectAll(this.pipeline));
        return this.$iteration == null ? null : elements[this.$iteration];
    }

    nextIndex() {
        this.$iteration = this.$iteration == null ? 0 : this.$iteration + 1;
    }
}
