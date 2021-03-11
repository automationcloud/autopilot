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
import { params } from '../model';
import { Pipe } from '../pipe';
import * as util from '../util';

export class StringJoin extends Pipe {
    static $type = 'String.join';
    static $help = `
Returns a single element with string value, produced by concatenating all values of input elements
with specified separator.

An error is thrown if input set contains object or array values, which are not supported.
`;

    @params.String()
    separator: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const separator = this.separator;

        const array = inputSet.map(el => el.value);
        for (const item of array) {
            util.checkType(item, ['string', 'number', 'boolean']);
        }
        const el = await this.createDocument(array.join(separator));
        return [el];
    }
}
