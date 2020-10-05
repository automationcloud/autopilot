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

import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';

import Json5 from 'json5';

export class ValueGetJson extends Pipe {
    static $type = 'Value.getJson';
    static $help = `
Returns the specified JSON object.

### Use For

- testing (quickly providing pipelines with any data)
- building templates for Job Outputs and Network Requests,
  which can subsequently be modified or extended
`;

    @params.Json()
    value: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const json = Json5.parse(this.value);
        return this.map(inputSet, el => {
            return el.clone(json);
        });
    }
}
