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

import { params } from '../model';
import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class ValueParseUrl extends Pipe {
    static $type = 'String.parseUrl';
    static $help = `
Parses input string using embedded URL parser, and returns the result.

The result is an object containing following properties:

- protocol (e.g. \`http:\`, \`https:\`)
- host (e.g. \`example.com\`, \`example.com:3123\`)
- hostname (e.g. \`example.com\`)
- pathname (e.g. \`/path/to/resource\`)
- query: an object with query parameters (e.g. \`{ hello: 'world' }\`)
- hash (e.g. \`#link\`)
`;

    @params.Boolean({
        help: 'Return `null` instead of throwing an error, if URL cannot be parsed.',
    })
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const optional = this.optional;

        return this.map(inputSet, el => {
            util.checkType(el.value, 'string');
            const parsed = util.parseUrl(el.value);
            util.assertPlayback(!!parsed || optional, 'URL parsing failed');
            return el.clone(parsed);
        });
    }
}
