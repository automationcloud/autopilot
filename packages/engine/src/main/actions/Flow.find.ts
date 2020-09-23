// Copyright 2020 Ubio Limited
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
import { Pipeline } from '../pipeline';
import { params } from '../model';

export class FindAction extends Action {
    static $type = 'Flow.find';
    static $icon = 'fas fa-search';
    static $help = `
Passes control to the children, modifying their scope.

The pipeline should return a single element, which becomes the scope of the children
(this is also known as _scope inheritance_).

Note: every time the children are executed the scope is re-evaluated;
specifically, if scope element disappears (or some other pipeline failure occurs),
then children won't be able to execute.

### Parameters

- optional: if checked, the pipeline is allowed to return 0 elements in which case the action is bypassed
  (the children will not be entered), otherwise an error is thrown if pipeline returns 0 elements

### Use For

- restrict children to a specific fragment of the page
- provide children with common input data and input DOM node
- with optional, conditionally skip a number of actions if pipeline yields 0 elements
`;

    @params.Pipeline()
    pipeline!: Pipeline;
    @params.Boolean()
    optional: boolean = false;

    hasChildren() {
        return true;
    }

    async resolveChildrenScope() {
        const el = await this.selectSingle(this.pipeline, this.optional);
        return el ? [el] : [];
    }

    async exec() {
        await this.retry(async () => {
            const els = await this.resolveChildrenScope();
            this.$runtime.bypassed = els.length === 0;
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
