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

export class ListExists extends Pipe {
    static $type = 'List.exists';
    static $help = `
Returns a single element whose value is \`true\` if the input set contains one or more elements,
and \`false\` otherwise. The DOM node of the result is set to top #document.

### Use For

- checking if collection has elements (e.g. as part of filters or matchers)
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const value = inputSet.length > 0;
        const el = await this.createDocument(value);
        return [el];
    }
}
