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

import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueMatchesRegexp extends Pipe {
    static $type = 'String.matchesRegexp';
    static $help = `
Returns \`true\` if input string matches specified regular expression, and \`false\` otherwise.
An error is thrown iff input value is not a string.

See [String#match](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)
for more information about regular expressions matching.

### Parameters

- regexp: regular expression
- flags

### Use For

- general purpose string matching (e.g. as part of matchers or conditions)

### See Also

- Replace Regexp: for replacing string with regular expressions
- Extract Regexp: for retrieving capturing groups
`;

    @params.String()
    regexp: string = '';
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

        const flags = caseInsensitive ? 'gi' : 'g';
        const r = new RegExp(regexp, flags);
        return this.map(inputSet, el => {
            util.checkType(el.value, 'string');
            return el.clone(r.test(el.value));
        });
    }
}
