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
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';
import jsonPointer from 'jsonpointer';

export class ValueHasPath extends Pipe {
    static $type = 'Object.hasPath';
    static $help = `
Returns \`true\` if input object contains anything at specified path.
An error is thrown if input value is not an object or an array.

### Use For

- checking whether optional data is set (e.g. whether inbound flight object is specified)
`;

    @params.String({
        source: 'dataPaths',
        help: 'JSON pointer into input data.',
        showInHeader: true,
    })
    path: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const path = this.path;

        return this.map(inputSet, el => {
            util.checkType(el.value, ['object', 'array']);
            const data = jsonPointer.get(el.value, path);
            return el.clone(data != null);
        });
    }
}
