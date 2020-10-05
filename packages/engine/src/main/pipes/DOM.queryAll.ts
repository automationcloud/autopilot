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
import { params } from '../model';
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';

export class DomQueryAll extends Pipe {
    static $type = 'DOM.queryAll';
    static $help = `
Returns all Element nodes found by specified selector.

### Use For

- returning a group of elements (e.g. prices) for further manipulation (e.g. text parsing)

### See Also

- DOM.queryOne: for the equivalent pipe which returns a single node
`;

    @params.Selector()
    selector: string = '';

    @params.Boolean({
        help: 'Produce 0 elements instead of throwing an error when no elements are found.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const selector = this.selector;
        const optional = this.optional;

        return await this.map(inputSet, el => el.queryAll(selector, optional));
    }
}
