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
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';

export class CustomLabel extends Pipe {
    static $type = 'Custom.label';
    static $help = `
This pipe is a simple group with a customized label.
The input set is passed to the inner pipeline and the output set of the inner pipeline
becomes the output set of this pipe.

### Use For

- structuring complex pipelines
`;

    @params.String({
        help: 'String label which will appear in user interface, has no effect on produced results.',
    })
    label: string = '';

    @params.Pipeline()
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        return await pipeline.selectAll(inputSet, ctx);
    }
}
