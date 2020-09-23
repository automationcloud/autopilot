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

export class NumberSum extends Pipe {
    static $type = 'Number.sum';
    static $help = `
Returns a single element whose value is a numeric sum of all input set values.
`;

    async apply(inputSet: Element[]): Promise<Element[]> {
        const sum = inputSet.reduce((sum, el) => {
            const num = parseFloat(el.value) || 0;
            return num + sum;
        }, 0);
        const el = await this.createDocument(sum);
        return[el];
    }
}
