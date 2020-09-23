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

export class ValueMapRange extends Pipe {
    static $type = 'Number.mapRange';
    static $help = `
Returns a string value corresponding to one of the configured numeric ranges where the input value belongs to.

The configured ranges must cover the expected numeric domain and must not overlap to prevent ambiguity.

The lower bounds of are always inclusive, whereas the upper bounds are always exclusive.
Therefore, ranges \`[0, 3)\` and \`[3, 5)\` form a continuous range \`[0, 5)\` with no "holes" in it;
and the input value \`3\` will belong to the second range.

An error is thrown if input value is not a number, or if the number does not belong to any range.

### Use For

- mapping continuous ranges into discrete categories (e.g. passenger age groups)
`;

    @params.Recordset({
        singular: 'range',
        fields: [
            {
                name: 'value',
                type: 'string',
                value: '',
            },
            {
                name: 'min',
                type: 'number',
                value: null,
            },
            {
                name: 'max',
                type: 'number',
                value: null,
            },
        ],
        help: `
List of range-to-value mappings:

- value: an output value which is returned if input value belongs to this range
- min: a number, the lower bound of this range (inclusive); if omitted, -Infinity is implied
- max: a number, the upper bound of this range (exclusive); if omitted, +Infinity is implied
`,
    })
    ranges: util.MapRange[] = [];

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return this.map(inputSet, el => {
            util.checkType(el.value, 'number');
            const newValue = util.mapRange(this.ranges, el.value);
            return el.clone(newValue);
        });
    }
}
