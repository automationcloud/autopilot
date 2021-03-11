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

import { RuntimeCtx } from '../ctx';
import { Element } from '../element';
import { Pipe } from '../pipe';
import * as util from '../util';

export class ValueIsEmpty extends Pipe {
    static $type = 'Value.isEmpty';
    static $help = `
Returns \`true\` if input value is either an empty string, an empty array or \`null\`.
The string is considered empty if it contains nothing but whitespace.

### Use For

- checking for null values, especially if previous pipe is optional
  (that is, allowed to return \`null\` values instead of throwing errors, which is a common pipe convention)
- checking for empty strings
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return this.map(inputSet, el => {
            const isEmpty = util.normalizeString(el.value) === '';
            return el.clone(isEmpty);
        });
    }
}
