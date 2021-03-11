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

import { Action } from '../action';
import { params } from '../model';
import { Pipeline } from '../pipeline';
import * as util from '../util';

export class JavascriptAction extends Action {
    static $type = 'Eval.javascript';
    static $icon = 'fas fa-code';
    static $help = `
Executes arbitrary JavaScript code.

Following top-level variables are available:

- \`els\` — output set of pipeline
- \`el\` — first element of \`els\` (for convenience, when dealing with single-element pipes)
- \`ctx\` — a context object
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    @params.JavaScript()
    expression: string = '// Enter your code here\nreturn el.value;';

    @params.Outcome()
    $outcome: any = undefined;

    @params.Number({
        min: 1000,
    })
    timeout: number = 60000;

    reset() {
        super.reset();
        this.$outcome = undefined;
    }

    async exec() {
        const els = await this.selectAll(this.pipeline);
        const ctx = this.createCtx();
        const js = util.compileAsyncJs(this.expression, 'ctx', 'els', 'el');
        this.$outcome = await js(ctx, els, els[0]);
    }
}
