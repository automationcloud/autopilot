import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class EvalJavascript extends Pipe {
    static $type = 'Eval.javascript';
    static $help = `
Executes an arbitrary JavaScript code and returns its results.

### Use For

- advanced scripting
`;

    @params.Enum({
        enum: ['element', 'value', 'collection'],
        help: `
Execution mode:

- value: the code has access to \`value\`, \`el\` and \`ctx\` objects
  and is expected to return a JSON-serializable value;
  the input set size and DOM nodes are maintained in this mode — only values are replaced
- element: the code has access to \`value\`, \`el\` and \`ctx\`
  objects and is expected to return a new Element instance with \`value\` attached to it;
  if code returns \`null\` then the element is discarded
- collection: the code has access to \`inputSet\` and \`ctx\` and is expected
  to return a new array of Element instances
`,
    })
    mode: string = 'element';

    @params.JavaScript()
    expression: string = 'return el;';

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        switch (this.mode) {
            case 'element':
                return await this.processElement(inputSet, ctx);
            case 'value':
                return await this.processValue(inputSet, ctx);
            case 'collection':
                return await this.processCollection(inputSet, ctx);
            default:
                throw util.scriptError(`Unknown mode: ${this.mode}`);
        }
    }

    async processElement(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const js = util.compileAsyncJs(this.expression, 'ctx', 'el');
        const results = [];
        for (const el of inputSet) {
            const newEl = await js(ctx, el);
            if (newEl == null) {
                continue;
            }
            util.assertPlayback(newEl instanceof Element, 'Function should return an Element instance or null');
            results.push(newEl.clone());
        }
        return results;
    }

    async processValue(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const js = util.compileAsyncJs(this.expression, 'ctx', 'el', 'value');
        const results = [];
        for (const el of inputSet) {
            let newData = await js(ctx, el, el.value);
            if (newData == null) {
                newData = null;
            }
            results.push(el.clone(newData));
        }
        return results;
    }

    async processCollection(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const js = util.compileAsyncJs(this.expression, 'ctx', 'inputSet');
        const newEls = await js(ctx, inputSet);
        for (const el of newEls) {
            util.assertPlayback(el instanceof Element, 'Function should return an Array of Element instances');
        }
        return newEls;
    }
}
