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
import { params } from '../model';
import { Pipe } from '../pipe';
import * as util from '../util';

export class ValueReplaceRegexp extends Pipe {
    static $type = 'String.replaceRegexp';
    static $help = `
Returns a new string with some (or all) matches of specified regular expression replaced with specified replacement.
An error is thrown if input value is not a string.

See [String#replace](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace)
for more information about regular expressions and replacement strings.

### Use For

- general purpose search-and-replace (e.g. trim unwanted characters from string)

### See Also

- Matches Regexp: for testing if string matches regular expression
- Extract Regexp: for retrieving capturing groups
`;

    @params.String()
    regexp: string = '';
    @params.String()
    replacement: string = '';
    @params.Boolean()
    caseInsensitive: boolean = true;

    init(spec: any) {
        super.init(spec);
        // Migration
        if (spec.flags) {
            this.caseInsensitive = spec.flags.includes('i');
        }
    }

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const regexp = this.regexp;
        const caseInsensitive = this.caseInsensitive;
        const replacement = this.replacement;

        const flags = caseInsensitive ? 'gi' : 'g';
        const r = new RegExp(regexp, flags);
        return this.map(inputSet, el => {
            util.checkType(el.value, 'string');
            const result = el.value.replace(r, replacement);
            return el.clone(result);
        });
    }
}
