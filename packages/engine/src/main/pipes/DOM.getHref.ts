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

export class DomHref extends Pipe {
    static $type = 'DOM.getHref';
    static $help = `
Returns a fully resolved URL as specified by href attribute of \`<a>\` DOM elements (links).
An error is thrown if input element is not a link.

### Use For

- extracting absolute href value from links
`;

    @params.Boolean({
        help: 'Returns `null` instead of throwing error when input element is not a link.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const optional = this.optional;

        return await this.map(inputSet, async el => {
            const href = await el.evaluateJson(el => el.href);
            util.assertPlayback(href || optional, 'Element does not contain href');
            return el.clone(href || null);
        });
    }
}
