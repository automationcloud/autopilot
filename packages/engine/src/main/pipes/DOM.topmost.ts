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
import { Element } from '../element';

export class FindTopmost extends Pipe {
    static $type = 'DOM.topmost';
    static $help = ``;

    async apply(inputSet: Element[]): Promise<Element[]> {
        const zIndexes = await Promise.all(inputSet.map(el => el.evaluateJson((el: HTMLElement) => {
            let max = 0;
            while (el.offsetParent) {
                const z = parseInt(window.getComputedStyle(el).getPropertyValue('z-index'));
                if (z && z > max) {
                    max = z;
                }
                el = el.offsetParent as HTMLElement;
            }
            const z = parseInt(window.getComputedStyle(el).getPropertyValue('z-index'));
            if (z && z > max) {
                max = z;
            }
            return max;
        })));
        const zipped: Array<[Element, number]> = inputSet.map((el, i) => [el, zIndexes[i]]);
        const sortedEls = zipped
            .sort((a, b) => a[1] > b[1] ? 1 : -1)
            .map(zip => zip[0]);
        return [sortedEls[0]];
    }
}
