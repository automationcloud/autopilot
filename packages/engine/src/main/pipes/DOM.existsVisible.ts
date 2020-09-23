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
import { Element } from '../element';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';

export class QueryExistsVisible extends Pipe {
    static $type = 'DOM.existsVisible';
    static $help = ``;

    @params.Selector()
    selector: string = '';

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = new Pipeline(this, '', [
            {
                selector: this.selector,
                optional: true,
                type: 'DOM.queryAll'
            },
            {
                type: 'List.filter',
                pipeline: [
                    { type: 'DOM.isVisible' }
                ],
            },
            {
                type: 'List.exists'
            }
        ]);
        return await pipeline.selectAll(inputSet, ctx);
    }
}
