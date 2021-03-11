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
import { Pipeline } from '../pipeline';
import * as util from '../util';

export class ValueAssign extends Pipe {
    static $type = 'Object.assign';
    static $help = `
Evaluates an object with inner pipeline,
then merges the resulting object with input object by assigning each key of the result to it.

The inner pipeline must resolve to a single element with object value. An error is thrown if input value is not object/array.

### Use For

- merging multiple objects together (analogous to \`Object.assign\` in JavaScript)
- mixing data from definition into input object
- assigning defaults values with Overwrite: false
`;

    @params.Pipeline({ label: 'Object' })
    pipeline!: Pipeline;
    @params.Boolean({
        help: `
- If checked, values with the same keys in the input object are overwritten
  by corresponding values of the resulting object.
- If unchecked, existing values in the input objects are preserved
  and corresponding values of resulting objects are discarded.
`,
    })
    overwrite: boolean = false;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        const overwrite = this.overwrite;

        util.assertScript(this.pipeline.length, 'No pipes defined');

        return await this.map(inputSet, async el => {
            util.checkType(el.value, 'object');
            const result = await pipeline.selectOne([el], ctx);
            util.checkType(result.value, 'object');
            const newData = util.deepClone(el.value);
            for (const key of Object.keys(result.value)) {
                const newValue = result.value[key];
                const existingValue = newData[key];
                if (overwrite || existingValue == null) {
                    newData[key] = newValue;
                }
            }
            return el.clone(newData);
        });
    }
}
