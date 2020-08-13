import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import { createError } from '../util';

export class AssertExists extends Pipe {
    static $type = 'Assert.exists';
    static $help = `
Throws an error with specified error code if input set does not contain any elements.
Otherwise, passes the input set along unmodified.

### Use For

- throwing specialized errors in pipelines with multiple filters to narrow down the filtering problems
`;

    @params.String({ source: 'errorCodes' })
    errorCode: string = 'AssertionFailed';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        if (!inputSet.length) {
            throw createError({
                code: this.errorCode,
                message: `Assertion failed: ${this.errorCode}`,
                retry: true,
                scriptError: true,
            });
        }
        return inputSet;
    }
}
