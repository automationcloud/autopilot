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

import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomInnerHtml extends Pipe {
    static $type = 'DOM.getInnerHtml';
    static $help = `
Returns \`innerHTML\` property of an element.

### Use For

- extracting HTML content

### See Also

- String.sanitizeHtml in case the extracted HTML is to be presented to user in some way
  (e.g. via output)
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return await this.map(inputSet, async el => {
            const innerHtml = await el.evaluateJson(el => el.innerHTML);
            return el.clone(util.normalizeString(innerHtml));
        });
    }
}
