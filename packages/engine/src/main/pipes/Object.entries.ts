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

import { Pipe } from '../pipe';
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';
import * as util from '../util';

export class ObjectEntries extends Pipe {
    static $type = 'Object.entries';
    static $help = `
Converts each object into \`[key, value]\` pairs for each property.

Throws an error if element value is not an object.
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return this.map(inputSet, el => {
            const results: Element[] = [];
            const obj = el.value;
            util.checkType(obj, 'object');
            for (const entry of Object.entries(obj)) {
                results.push(el.clone(entry));
            }
            return results;
        });
    }
}
