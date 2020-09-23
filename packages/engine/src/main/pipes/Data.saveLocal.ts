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
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DataLocalSave extends Pipe {
    static $type = 'Data.saveLocal';
    static $deprecated = 'Using this pipe is highly discouraged. The pipe is scheduled for removal.';
    static $help = `
Saves input set, so that it could be later restored with Local Restore.

### Use For

- Do not. This pipe allows creating very non-intuitive data flows, which are nearly impossible to reason about.
- Consider using more conventional tools for solving the problem, or create a custom pipe if none work.
`;

    @params.String({ source: 'locals' })
    key: string = '';

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        ctx.setLocal(this.key, inputSet);
        return inputSet;
    }
}
