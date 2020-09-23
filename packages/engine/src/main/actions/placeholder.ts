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
import * as util from '../util';
import { params } from '../model';

export class PlaceholderAction extends Action {
    static $type = 'placeholder';
    static $icon = 'far fa-circle';
    static $hidden = true;
    static $help = `
Use this action to get quick access to pipeline configuration and deciding what to do with its results later.

After pipeline is congifured, use Change Type to convert the placeholder into one of the actions.

Running the placeholder will result in an error.
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    async exec() {
        throw util.scriptError('Cannot run a placeholder. Please convert it into a specific action.');
    }
}
