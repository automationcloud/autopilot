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

import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomAttribute extends Pipe {
    static $type = 'DOM.getAttribute';

    static $help = `
Returns the value of specified DOM attribute.
An error is thrown if attribute does not exist on one of the input elements.

### Use For

- extracting information from DOM attributes
    `;

    @params.String({
        source: 'attributes',
        help: 'Name of the attribute.',
    })
    attribute: string = '';
    @params.Boolean({
        help: 'Return `null` instead of throwing an error if attribute does not exist.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const attrName = this.attribute;
        const optional = this.optional;

        return await this.map(inputSet, async el => {
            const { attributes } = await el.getInfo();
            const attrValue = attributes[attrName];
            util.assertPlayback(attrValue || optional, `Attribute ${attrName} not found`);
            return el.clone(attrValue || null);
        });
    }
}
