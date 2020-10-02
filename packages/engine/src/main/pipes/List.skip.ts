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

export class ListSkip extends Pipe {
    static $type = 'List.skip';
    static $help = `
Discards specified number of elements and returns everything else.

### Use For

- excluding placeholder elements from sets, specifically for \`<option>\`
  elements whose first element is typically a placeholder and does not represent an actual option
- excluding other kinds of elements like table headers or column headers
`;

    @params.Number({ min: 0 })
    count: number = 1;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const count = this.count;
        return inputSet.slice(count);
    }
}
