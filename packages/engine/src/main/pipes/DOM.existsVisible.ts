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
