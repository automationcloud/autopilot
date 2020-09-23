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

export class ValuePickKeys extends Pipe {
    static $type = 'Object.pick';
    static $help = `
Creates an object composed of picked input object keys.
An error is thrown if input value is not object/array.

This is effectively a keys whitelisting operation in a sense that it removes all keys not explicitly listed.

### Use For

- removing unwanted or temporary data (e.g. for composing Job Output objects)
- shaping output objects

### See Also

- Compose: for shaping objects using bulk move operations
- Delete Path: for removing individual keys
`;

    @params.Keys({
        help: 'Object keys to pick, all other keys not listed here are discarded.',
    })
    keys: string[] = [];

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const keys = this.keys;
        return this.map(inputSet, el => {
            util.checkType(el.value, 'object');
            const newData: any = {};
            for (const key of keys) {
                newData[key] = el.value[key];
            }
            return el.clone(newData);
        });
    }
}
