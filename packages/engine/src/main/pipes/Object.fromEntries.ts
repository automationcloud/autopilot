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
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import * as util from '../util';
import { params } from '../model';
import jsonPointer from 'jsonpointer';

export class ObjectFromEntries extends Pipe {
    static $type = 'Object.fromEntries';
    static $help = `
Returns a single object with properties correspinding to each value of the input set.
JSON paths are used to control which properties of input set correspond to key/value of the object.
The DOM node of the result is set to top #document.
`;

    @params.String({ source: 'dataPaths' })
    keyPath: string = '/0';

    @params.String({ source: 'dataPaths' })
    valuePath: string = '/1';

    @params.Enum({
        enum: ['ignore', 'error'],
        help: `
Specifies what action to take if one of the elements does not contain a property
designated by \`keyPath\`.

- ignore: the property is not included in the object
- error: an error is thrown
`,
    })
    onMissingKey: string = 'error';

    @params.Enum({
        enum: ['ignore', 'error'],
        help: `
Specifies what action to take if one of the elements does not contain a property
designated by \`valuePath\`.

- ignore: the property is not included in the object
- error: an error is thrown
`,
    })
    onMissingValue: string = 'error';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const object: any = {};
        for (const el of inputSet) {
            util.checkType(el.value, ['object', 'array']);
            const key = jsonPointer.get(el.value, this.keyPath);
            const value = jsonPointer.get(el.value, this.valuePath);
            if (key == null) {
                if (this.onMissingKey === 'ignore') {
                    continue;
                }
                throw util.playbackError('Key does not exist at specified path');
            }
            if (value === undefined) {
                if (this.onMissingValue === 'ignore') {
                    continue;
                }
                throw util.playbackError('Value does not exist at specified path');
            }
            object[key] = value;
        }
        const result = await this.createDocument(object);
        return [result];
    }
}
