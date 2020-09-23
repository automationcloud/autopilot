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

import { Pipe } from '../pipe';
import { params } from '../model';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomClosest extends Pipe {
    static $type = 'DOM.closest';
    static $help = `
Returns the closest ancestor of an element matching specified selector.
Throws an error if no such element is found.
`;

    @params.Selector()
    selector: string = '';
    @params.Boolean({
        help: 'Omit an element if no matching ancestor is found.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const selector = this.selector;
        const optional = this.optional;

        return await this.map(inputSet, el => el.closest(selector, optional));
    }
}
