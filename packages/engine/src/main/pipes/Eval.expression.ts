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
import * as util from '../util';

export class EvalExpression extends Pipe {
    static $type = 'Eval.expression';
    static $help = `
Evaluates expression according to following rules:

- if value starts with \`/\`, then it is interpreted as a JSON pointer into an input object,
  thus behaving in a similar manner to Get Path
- if value starts with \`=\`, then the rest is interpreted as a JavaScript expression,
  which has access to top-level keys of input object
- all other values are interpreted as string constants

The \`=\` mode is also useful for making constants, for example:

- \`= true\` for booleans,
- \`= 42\` for numbers,
- \`= "/some/path"\` for string constants which start with \`/\`

### Use For

- flexible evaluation of expressions based on input values (arithmetic, boolean, string composition, etc)
- lightweight alternative to JavaScript
`;

    @params.JavaScript()
    expression: string = '';

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const expression = this.expression;

        return this.map(inputSet, el => {
            const newData = util.evalExpression(expression, util.deepClone(el.value), { ctx });
            return el.clone(newData);
        });
    }
}
