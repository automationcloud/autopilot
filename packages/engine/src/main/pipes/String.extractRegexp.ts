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

export class ValueExtractRegexp extends Pipe {
    static $type = 'String.extractRegexp';
    static $help = `
Matches input string against specified regular expressions and returns an array of strings,
where first element is a whole match and subsequent elements are captured regex groups.

An error is thrown if input value is not a string.
On No Match parameter controls the behaviour when input string does not match the regular expression,
by default an error is thrown.

See [RegExp#exec](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec)
for more information about regular expressions matching and capturing groups.

### Use For

- extracting parts of string (e.g. to extract flight information from strings like \`SFO-18 / 01 / 29\`)
`;

    @params.String()
    regexp: string = '';

    @params.Boolean()
    caseInsensitive: boolean = true;

    @params.Boolean({
        help: `
Specifies the behaviour when input string does not match regular expression:

- error: error is thrown
- discard: element is removed from the output set
- null: null value is returned
`,
    })
    matchAll: boolean = false;

    @params.Boolean()
    optional: boolean = false;

    init(spec: any) {
        super.init(spec);
        if (spec.onNoMatch === 'discard') {
            this.optional = true;
        }
    }

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const optional = this.optional;
        const regexp = this.regexp;
        const caseInsensitive = this.caseInsensitive;
        const matchAll = this.matchAll;

        const flags = [
            [caseInsensitive, 'i'],
            [matchAll, 'g'],
        ]
            .filter(_ => _[0])
            .map(_ => _[1])
            .join('');

        return this.map(inputSet, el => {
            util.checkType(el.value, 'string');
            const r = new RegExp(regexp, flags);
            const matches = matchAll ? this.performMatchAll(el.value, r) : this.performMatchOne(el.value, r);
            if (!matches.length) {
                util.assertPlayback(optional, `Value does not match the pattern`, {
                    value: util.abbr(el.value),
                });
                return [];
            }
            return matches.map(m => el.clone(m));
        });
    }

    performMatchAll(value: string, r: RegExp) {
        const results = [];
        let lastIndex = r.lastIndex;
        let m = r.exec(value);
        while (m != null) {
            util.assertScript(lastIndex !== r.lastIndex, 'Empty matching regexp not supported');
            lastIndex = r.lastIndex;
            results.push(m);
            m = r.exec(value);
        }
        return results;
    }

    performMatchOne(value: string, r: RegExp) {
        const m = r.exec(value);
        return m ? [m] : [];
    }
}
