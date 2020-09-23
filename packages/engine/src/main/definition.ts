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

import { Action } from './action';
import { Pipeline } from './pipeline';
import { params } from './model';

export class DefinitionAction extends Action {
    static $type = 'definition';
    static $category = 'Basic';
    static $icon = 'fas fa-cubes';
    static $hidden = true;
    static $help = `
Defines a pipeline which can subsequently be used in other actions via Use Definition pipe.

### Use For

- extracting common functionality (e.g. inbound and outbound flight selection would share common parts for extracting flight information, prices, etc.)
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    async exec() {}
}
