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

export class DefinitionUse extends Pipe {
    static $type = 'Definition.use';
    static $help = `
Passes each element in input set to the specified definition, returning its output.

This pipe is a primary means of working with definitions.
It allows extracting common functionality of different pipelines as a named definition,
so that the same pipes could be reused across multiple actions.

### Use For

- extracting common functionality (e.g. inbound and outbound flight selection
  would share common parts for extracting flight information, prices, etc.)
`;

    @params.Definition()
    definitionId: string = '';

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        return await ctx.evalDefinition(this.definitionId, inputSet);
    }
}
