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

export class ValueParseNumber extends Pipe {
    static $type = 'String.parseNumber';
    static $help = `
Parses a number value from input string.

An error is thrown if input value is not a string.

### Use For

- parsing numbers obtained from string representation (e.g. from web page attribute)
  for subsequent use with other numeric pipes
`;

    @params.Boolean()
    float: boolean = false;
    @params.Boolean()
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const optional = this.optional;

        return this.map(inputSet, el => {
            util.checkType(el.value, 'string');
            let num: number | null = this.float ? parseFloat(el.value) : parseInt(el.value, 10);
            if (isNaN(num)) {
                num = null;
            }
            util.assertPlayback(num != null || optional, 'Number parsing failed');
            return el.clone(num);
        });
    }
}
