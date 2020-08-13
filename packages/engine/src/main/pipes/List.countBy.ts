import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { Pipeline } from '../pipeline';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ListCountBy extends Pipe {
    static $type = 'List.countBy';
    static $help = `
Returns a single element whose value is an object computed as follows:

- each input element is passed through inner pipeline to evaluate a string key
- input elements are then grouped by this key
- the output object consists of key-value pairs where value indicates a count of elements in each group

This is similar to COUNT / GROUP BY from SQL and is primarily used in advanced scripting scenarios
(e.g. calculate the number of passengers in each group).

The DOM node of the result is set to top #document.

### Use For

- advanced scripting
`;

    @params.Pipeline({
        label: 'Group Key',
        help: 'Pipeline to evaluate key for each element in input set',
    })
    pipeline!: Pipeline;

    async apply(inputSet: Element[], ctx: RuntimeCtx): Promise<Element[]> {
        const pipeline = this.pipeline;
        const groups = [];
        for (const el of inputSet) {
            const result = await pipeline.selectOne([el], ctx);
            util.checkType(result.value, 'string');
            const group = groups.find(_ => util.anyEquals(_.key, result.value));
            if (group) {
                group.count += 1;
            } else {
                groups.push({ key: result.value, count: 1 });
            }
        }
        const newData: { [key: string]: any } = {};
        for (const group of groups) {
            newData[group.key] = group.count;
        }
        const resultEl = await this.createDocument(newData);
        return [resultEl];
    }
}
