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
import { params } from '../model';
import * as util from '../util';

export class FlowResetInput extends Action {
    static $type = 'Flow.resetInput';
    static $icon = 'fas fa-undo';
    static $help = `
Resets Job Input with specified Input key.


Note: Pair with \`Flow.outputEvent\` as a indication that reset input happened during the Automation
`;

    @params.String({ source: 'inputs' })
    inputKey: string = '';

    async exec() {
        util.assertScript(this.inputKey, 'Input key is not specified');
        await this.retry(async () => {
            await this.$script.resetInput(this.inputKey);
        });
    }
}
