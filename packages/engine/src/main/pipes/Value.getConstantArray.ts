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
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

interface Value {
    dataType: 'string' | 'number' | 'boolean';
    value: string;
}

export class ValueGetConstantArray extends Pipe {
    static $type = 'Value.getConstantArray';
    static $help = `
Returns an array of specified constant values.

### Use For

- quickly creating arrays of primitive values (numbers, strings, etc)
`;

    @params.Recordset({
        singular: 'value',
        fields: [
            {
                name: 'dataType',
                type: 'enum',
                value: 'string',
                enum: ['string', 'number', 'boolean'],
            },
            {
                name: 'value',
                type: 'string',
                value: '',
            },
        ],
    })
    values: Value[] = [];

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const values = this.values;
        const array = values.map(v => util.getConstant(v.dataType, v.value));
        return this.map(inputSet, el => {
            return array.map(v => el.clone(v));
        });
    }
}
