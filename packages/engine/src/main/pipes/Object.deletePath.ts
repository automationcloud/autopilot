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
import jsonPointer from 'jsonpointer';

export class ValueDeletePath extends Pipe {
    static $type = 'Object.deletePath';
    static $help = `
Removes the value at specified path. An error is thrown if input value is not object/array.

### Use For

- removing unwanted or temporary data (e.g. for composing Job Output objects)

### See Also

- Compose: for shaping objects using bulk move operations
- Pick: for whitelisting object keys
`;

    @params.String({
        source: 'dataPaths',
        help: 'JSON pointer into input data, specifies which value to remove from the object.',
    })
    path: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const path = this.path;

        return await this.map(inputSet, async el => {
            util.checkType(el.value, ['object', 'array']);
            const newData = util.deepClone(el.value);
            jsonPointer.set(newData, path, undefined);
            return el.clone(newData);
        });
    }
}
