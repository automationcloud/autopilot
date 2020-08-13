import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

import templateParser from '../grammars/template';
import jsonPointer from 'jsonpointer';

export class FormatTemplate extends Pipe {
    static $type = 'String.formatTemplate';
    static $deprecated = 'Use Expression instead';
    static $help = `
Returns a string formatted according to specified template.
The template allows inserting values from input using syntax
\`{/path/to/value}\` where \`/path/to/value\` is a JSON pointer into input object.

An error is thrown if input value is not object/array.

### Use For

- quickly composing a string representation of objects (e.g. for matching or filtering)
`;

    @params.Template()
    template: string = '';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const tokens = templateParser.parse(this.template);
        return this.map(inputSet, el => {
            util.checkType(el.value, ['object', 'array']);
            const value = this.resolve(el.value, tokens);
            return el.clone(value);
        });
    }

    resolve(object: any, tokens: any) {
        return tokens
            .map((token: any) => {
                switch (token.type) {
                    case 'text':
                        return token.value;
                    case 'expr':
                        return this.resolveExpr(token, object);
                    default:
                        throw util.assertScript(false, `Invalid token ${token.type}`, {
                            object,
                            token,
                        });
                }
            })
            .join('')
            .trim();
    }

    resolveExpr(token: any, object: any) {
        const { path } = token;
        const val = jsonPointer.get(object, path);
        util.assertPlayback(val != null, 'Expected non-empty value', {
            code: 'valueEmpty',
            path,
        });
        return util.castToString(val);
    }
}
