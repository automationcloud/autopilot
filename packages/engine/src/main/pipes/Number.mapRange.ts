import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueMapRange extends Pipe {
    static $type = 'Number.mapRange';
    static $help = `
Returns a string value corresponding to one of the configured numeric ranges where the input value belongs to.

The configured ranges must cover the expected numeric domain and must not overlap to prevent ambiguity.

The lower bounds of are always inclusive, whereas the upper bounds are always exclusive.
Therefore, ranges \`[0, 3)\` and \`[3, 5)\` form a continuous range \`[0, 5)\` with no "holes" in it;
and the input value \`3\` will belong to the second range.

An error is thrown if input value is not a number, or if the number does not belong to any range.

### Use For

- mapping continuous ranges into discrete categories (e.g. passenger age groups)
`;

    @params.Recordset({
        singular: 'range',
        fields: [
            {
                name: 'value',
                type: 'string',
                value: '',
            },
            {
                name: 'min',
                type: 'number',
                value: null,
            },
            {
                name: 'max',
                type: 'number',
                value: null,
            },
        ],
        help: `
List of range-to-value mappings:

- value: an output value which is returned if input value belongs to this range
- min: a number, the lower bound of this range (inclusive); if omitted, -Infinity is implied
- max: a number, the upper bound of this range (exclusive); if omitted, +Infinity is implied
`,
    })
    ranges: util.MapRange[] = [];

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return this.map(inputSet, el => {
            util.checkType(el.value, 'number');
            const newValue = util.mapRange(this.ranges, el.value);
            return el.clone(newValue);
        });
    }
}
