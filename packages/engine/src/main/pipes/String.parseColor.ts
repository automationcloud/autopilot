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

import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueParseColor extends Pipe {
    static $type = 'String.parseColor';
    static $help = `
Parses color value from input string, returning detailed information about color,
including its rgb, hsv, hsl values.
`;

    @params.Boolean({
        help: 'Return `null` instead of throwing if color cannot be parsed.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const optional = this.optional;
        return this.map(inputSet, el => {
            util.checkType(el.value, 'string');
            const color = util.parseColor(el.value);
            util.assertPlayback(color || optional, 'Color parsing failed');
            return el.clone(color);
        });
    }
}
