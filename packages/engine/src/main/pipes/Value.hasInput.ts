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
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';

export class ValueHasInput extends Pipe {
    static $type = 'Value.hasInput';
    static $help = `
Returns \`true\` if an Input with specified name exists, without requesting it.
`;

    @params.String({
        source: 'inputs',
        showInHeader: true,
    })
    inputKey: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const inputKey = this.inputKey;
        const data = await this.$script.peekInput(inputKey);
        return this.map(inputSet, el => {
            return el.clone(data !== undefined);
        });
    }
}
