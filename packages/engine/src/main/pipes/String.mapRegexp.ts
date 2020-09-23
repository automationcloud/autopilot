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
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

interface Pattern {
    value: string;
    regexp: string;
    flags: string;
}

export class ValueMapRegexp extends Pipe {
    static $type = 'String.mapRegexp';
    static $help = `
Matches the input string value against specified patterns,
then returns a string that corresponds to the matched pattern.
The behaviour when no patterns match is controlled by On No Match parameter.

An error is thrown if input value is not a string.

### Use For

- mapping enums from one domain to another (e.g. map \`mr\`, \`ms\`, \`mrs\` titles to website format and vice versa)
`;

    @params.Recordset({
        singular: 'pattern',
        fields: [
            {
                name: 'value',
                type: 'string',
                value: '',
            },
            {
                name: 'regexp',
                type: 'string',
                value: '',
            },
            {
                name: 'flags',
                type: 'string',
                value: 'ig',
            },
        ],
        help: `
List of pattern-to-value mappings:

- value: an output value which is returned if input value matches this mapping's regular expression
- regexp: to match the input value against
- flags
`,
    })
    patterns: Pattern[] = [];
    @params.Enum({ enum: ['error', 'discard', 'bypass'] })
    onNoMatch: string = 'error';

    init(spec: any) {
        super.init(spec);
        // Migration
        if (spec.onNoMatch === 'skip') {
            this.onNoMatch = 'discard';
        }
    }

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const patterns = this.patterns;
        const onNoMatch = this.onNoMatch;

        return this.map(inputSet, el => {
            util.checkType(el.value, 'string');
            const matches: string[] = [];
            for (const pattern of patterns) {
                const regexp = new RegExp(pattern.regexp, pattern.flags);
                if (regexp.test(el.value)) {
                    matches.push(pattern.value);
                }
            }
            switch (matches.length) {
                case 0:
                    switch (onNoMatch) {
                        case 'skip':
                        case 'discard':
                            return null;
                        case 'bypass':
                            return el;
                        default:
                            throw util.playbackError(
                                'Value does not match any patterns.' +
                                'Use "bypass" to return unmodified element, or "skip" to exclude it from results.',
                                {
                                    value: util.abbr(el.value),
                                }
                            );
                    }
                case 1:
                    return el.clone(matches[0]);
                default:
                    throw util.playbackError('Value matches multiple patterns');
            }
        });
    }

}
