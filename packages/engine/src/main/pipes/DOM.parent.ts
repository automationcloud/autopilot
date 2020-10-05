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

import * as util from '../util';
import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';

export class DomParent extends Pipe {
    static $type = 'DOM.parent';
    static $help = `
For each input element returns its DOM parent.
An error is thrown if parent not found (i.e. applied to #document).

### Parameters

- optional: if checked,

### Use For

- traversing DOM hierarchy to locate the desired element
`;

    @params.Number({
        min: 1,
        max: 999,
        help: 'Specifies how many ancestors to climb up (default is 1).',
    })
    count: number = 1;

    @params.Boolean({
        help: 'Produce 0 elements instead of throwing an error when applied to #document.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const count = this.count;
        const optional = this.optional;

        util.assertScript(count >= 1, 'Count should be a positive integer');
        return await this.map(inputSet, async el => {
            let newEl = el;
            for (let i = 0; i < count; i += 1) {
                const nextEl = await newEl.parent(optional);
                if (!nextEl) {
                    return null;
                }
                newEl = nextEl;
            }
            return newEl;
        });
    }
}
