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

import { RuntimeCtx } from '../ctx';
import { Element } from '../element';
import { Pipe } from '../pipe';

export class DomIsVisible extends Pipe {
    static $type = 'DOM.isVisible';
    static $help = `
Returns true if Element is visible, that is:

- its content box has both width and height greater than zero
- its CSS styles don't include visibility: hidden

### Use For

- filtering invisible elements for further manipulations
- asserting element visibility in expectations
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return await this.map(inputSet, async el => {
            return el.clone(await el.remote.isVisible());
        });
    }
}
