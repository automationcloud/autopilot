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
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomOutermost extends Pipe {
    static $type = 'DOM.outermost';
    static $help = `
Discards elements that are enclosed by other elements from the same set.
This leaves only the "outermost" elements in the output set.

### Use For

- squashing element sets that are loosely defined,
  in particular if website does not have semantic DOM structure to work with

### See Also

- DOM.innermost: for the inverse functionality
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const results = [];
        for (let i = 0; i < inputSet.length; i += 1) {
            const el = inputSet[i];
            let outermost = true;
            for (let j = 0; j < inputSet.length; j += 1) {
                const otherEl = inputSet[j];
                if (i === j) {
                    continue;
                }
                if (await otherEl.remote.contains(el.remote)) {
                    outermost = false;
                    break;
                }
            }
            if (outermost) {
                results.push(el);
            }
        }
        return results;
    }
}
