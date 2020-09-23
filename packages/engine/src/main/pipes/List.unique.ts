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

import { Pipe } from '..';
import { Element } from '../element';
import jsonStableStringify from 'fast-json-stable-stringify';

export class ListUnique extends Pipe {
    static $type = 'List.unique';

    async apply(inputList: Element[]) {
        const set: Set<string> = new Set();
        return await this.map(inputList, async el => {
            const val = el.objectId + '|' + jsonStableStringify(el.value ?? null);
            if (set.has(val)) {
                return null;
            }
            set.add(val);
            return el;
        });
    }

}
