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

export class DomGetDocument extends Pipe {
    static $type = 'DOM.document';
    static $help = `
Replace the DOM node of each input element with top #document node.

### Use For

- accessing elements outside of current DOM scope (e.g. inside \`each\` loop)
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const document = await this.$page.document();
        return await this.map(inputSet, async el => {
            return new Element(document, el.value);
        });
    }
}
