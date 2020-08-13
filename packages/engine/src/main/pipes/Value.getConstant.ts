import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import * as util from '../util';
import { params } from '../model';

export class ValueGetConstant extends Pipe {
    static $type = 'Value.getConstant';
    static $help = `
Returns specified constant value.

### Use For

- obtaining a constant value which never changes across script executions
  (e.g. for navigating to specific constant URL)
- quickly test actions that require a string input
`;

    @params.String()
    value: string = '';
    @params.Enum({ enum: ['string', 'number', 'boolean'] })
    dataType: 'string' | 'number' | 'boolean' = 'string';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const value = this.getValue();
        return this.map(inputSet, el => el.clone(value));
    }

    getValue(): any {
        const value = this.value;
        const dataType = this.dataType;
        return util.getConstant(dataType, value);
    }
}
