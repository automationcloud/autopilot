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

export class ValueParseBoolean extends Pipe {
    static $type = 'String.parseBoolean';
    static $help = `
Parses a boolean value from input string.

An error is thrown if input value is not a string.

### Use For

- parsing booleans obtained from string representation (e.g. from web page attribute)
`;

    @params.Boolean()
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const optional = this.optional;

        return this.map(inputSet, el => {
            util.checkType(el.value, 'string');
            const bool = el.value === 'true' ? true : el.value === 'false' ? false : null;
            util.assertPlayback(bool != null || optional, 'Boolean parsing failed');
            return el.clone(bool);
        });
    }
}
