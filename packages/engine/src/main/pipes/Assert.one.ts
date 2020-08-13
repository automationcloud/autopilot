import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';
import { createError } from '../util';

export class AssertOne extends Pipe {
    static $type = 'Assert.one';
    static $help = `
Asserts that input set contains exactly one element, otherwise throws a specified error.
`;

    @params.String({ source: 'errorCodes' })
    errorCode: string = 'AssertionFailed';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        if (inputSet.length !== 1) {
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
