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

export class GroupAction extends Action {
    static $type = 'Flow.group';
    static $icon = 'fas fa-folder';
    static $help = `
Groups a set of actions.

### Use For

- structuring and organizing scripts
`;

    hasChildren() {
        return true;
    }

    async exec() {}

    afterRun() {
        this.enter();
    }
}
