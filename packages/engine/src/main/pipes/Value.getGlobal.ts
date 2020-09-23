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
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueGetGlobal extends Pipe {
    static $type = 'Value.getGlobal';
    static $help = `
Returns the value of specific Global variable (set by Set Global action).
An error is thrown if Global variable is not set.

### Use For

- accessing global variables (advanced scripting)
`;

    @params.String({
        source: 'globals',
        help: 'Key of the Global variable (as specified by Set Global action).',
    })
    key: string = '';

    @params.Boolean({
        help: `Return \`null\` instead of throwing an error when specified Global variable is not set.`,
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const key = this.key;
        const optional = this.optional;

        const data = this.$script.getGlobal(key, optional);
        return this.map(inputSet, el => {
            return el.clone(data);
        });
    }
}
