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

import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListFromArray extends Pipe {
    static $type = 'List.fromArray';
    static $help = `
Given an array as input value, creates an element for each value of this array.

For example, if input set contains 2 elements with arrays \`[1, 2, 3]\` and \`[4, 5]\` respectively,
then the output set will contain 5 elements with values \`1\`, \`2\`, \`3\`, \`4\`, \`5\` respectively.

An error is thrown if input value is not an array.

### Use For

- trasnforming arrays (e.g. from Job Input) into elements for subsequent manipulations with other pipes

### See Also

- List.toArray: for reverse functionality
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return this.map(inputSet, el => {
            util.checkType(el.value, 'array');
            return el.value.map((datum: any) => el.clone(datum));
        });
    }
}
