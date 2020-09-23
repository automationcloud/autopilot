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

export class SleepAction extends Action {
    static $type = 'Flow.sleep';
    static $icon = 'fas fa-hourglass-half';
    static $help = `
Waits for specified number of milliseconds.

This is unreliable (but easy) method of waiting for arbitrarily long processes to finish.
It is recommended to use Expect for scripting such cases, whenever it is possible to do so.

### Parameters

- delay: milliseconds to wait
`;

    @params.Number({ min: 0 })
    delay: number = 1000;

    async exec() {
        const timeoutAt = Date.now() + this.delay;
        while (Date.now() < timeoutAt) {
            await new Promise(r => setTimeout(r, 100));
            await this.$script.tick();
        }
    }
}
