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
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';

export class ValueContainsText extends Pipe {
    static $type = 'Value.containsText';
    static $help = `
Returns \`true\` if input value contains specified string constant.
Non-string values are coerced to strings and are tested according to rules specified in Contains.

### Parameters

- text: string constant to test the input value against

### Use For

- creating matchers where matching text partially is preferred
- general purpose string containment tests against string constant
`;

    @params.String()
    text: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const text = this.text;

        return this.map(inputSet, el => {
            return el.clone(util.strContains(el.value, text));
        });
    }
}
