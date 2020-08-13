import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { params } from '../model';

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
    expression: string = '';

    @params.Number({
        min: 1000,
    })
    timeout: number = 60000;

    async exec() {
        const els = await this.selectAll(this.pipeline);
        const ctx = this.createCtx();
        const js = util.compileAsyncJs(this.expression, 'ctx', 'els', 'el');
        await js(ctx, els, els[0]);
    }
}
