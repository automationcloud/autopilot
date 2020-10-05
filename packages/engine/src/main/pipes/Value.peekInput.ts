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

export class ValuePeekInput extends Pipe {
    static $type = 'Value.peekInput';
    static $help = `
Gets the input without requesting it, i.e. doesn't set job.state = 'awaitingInput' if the input not exists yet.

### Use For

- checking if the Job Input is supplied by the time of playback
`;

    @params.String({ source: 'inputs' })
    inputKey: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const data = await this.$script.peekInput(this.inputKey);
        return this.map(inputSet, el => {
            return el.clone(data);
        });
    }
}
