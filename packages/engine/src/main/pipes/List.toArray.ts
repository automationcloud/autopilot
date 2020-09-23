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

import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListToArray extends Pipe {
    static $type = 'List.toArray';
    static $help = `
Returns a single element whose value is an array containing all values of the input set.
The DOM node of the result is set to top #document.

### Use For

- transforming elements into arrays (e.g. to use as part of Job Output)

### See Also

- Unfold Array: for reverse functionality
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const array = inputSet.map(el => el.value);
        const el = await this.createDocument(array);
        return [el];
    }
}
