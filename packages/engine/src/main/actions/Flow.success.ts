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

export class SuccessAction extends Action {
    static $type = 'Flow.success';
    static $icon = 'fas fa-check-circle';
    static $help = `
Finishes script execution with Success status.

Note: normally, success is reported via success contexts.
Use this action only when imperative success handling is required.

### Use For

- advanced scripting, when exiting early is required
`;

    async exec() {}

    leave() {
        this.$script.setStatus('success');
    }
}
