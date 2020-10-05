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
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';

import jsonPointer from 'jsonpointer';

export class ObjectWrap extends Pipe {
    static $type = 'Object.wrap';
    static $help = `
Returns a new object with input value placed at specified path.

### Use For

- creating objects out of other value types for further manipulation
- collecting data from multiple sources
`;

    @params.String({
        help: 'JSON pointer into newly created object, where input value is to be written.',
    })
    path: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const path = this.path;
        return this.map(inputSet, el => {
            const newData = {};
            jsonPointer.set(newData, path, el.value);
            return el.clone(newData);
        });
    }
}
