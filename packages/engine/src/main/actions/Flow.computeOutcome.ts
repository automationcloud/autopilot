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
import { Pipeline } from '../pipeline';
import { params } from '../model';

export class FlowComputeOutcome extends Action {
    static $type = 'Flow.computeOutcome';
    static $icon = 'fas fa-microchip';
    static $help = `
Computes a pipeline, storing a result which can subsequently be accessed
with \`Flow.getOutcome\` pipe.
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    @params.Outcome({
        label: 'Result',
        placeholder: 'Run the action to see the outcome value.',
    })
    $outcome: any = undefined;

    reset() {
        super.reset();
        this.$outcome = undefined;
    }

    async exec() {
        await this.retry(async () => {
            const el = await this.selectOne(this.pipeline);
            this.$outcome = el.value;
        });
    }
}
