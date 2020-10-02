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

export class DomComputedStyle extends Pipe {
    static $type = 'DOM.getComputedStyle';
    static $help = `
Returns the value of specified style, computed by browser.
Throws an error if the style is not recognized by browser and therefore cannot be computed.

### Use For

- addressing edge cases where filtering or value extraction is only possible by looking at CSS styles
  (e.g. color, borders, etc.)
`;

    @params.String({
        help: 'CSS style name to extract.',
    })
    style: string = '';
    @params.Boolean({
        help: 'Return `null` instead of throwing an error if style is not recognized by browser.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const style = this.style;
        const optional = this.optional;

        return await this.map(inputSet, async el => {
            const result = await el.evaluateJson((el, style: string) => {
                const styles = window.getComputedStyle(el);
                return (styles as any)[style];
            }, style);
            util.assertPlayback(result || optional, `Style ${style} not recognized`);
            return el.clone(result || null);
        });
    }
}
