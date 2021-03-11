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

import { RuntimeCtx } from '../ctx';
import { Element } from '../element';
import { Pipe } from '../pipe';
import * as util from '../util';

export class ValueFormatUrl extends Pipe {
    static $type = 'Data.formatUrl';
    static $help = `
Takes input object with URL components and returns a URL string.

URL components may include following keys:

- protocol (e.g. \`http:\`, \`https:\`)
- host (e.g. \`example.com\`, \`example.com:3123\`)
- hostname (e.g. \`example.com\`)
- pathname (e.g. \`/path/to/resource\`)
- query: an object with query parameters (e.g. \`{ hello: 'world' }\`)
- hash (e.g. \`#link\`)

Query parameters are automatically URI-encoded.

An error is thrown if input value is not an object, or if there's not enough information to construct a URL.

### Use For

- composing URLs for network requests and other applications
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return this.map(inputSet, el => {
            util.checkType(el.value, 'object');
            const newData = util.formatUrl(el.value);
            return el.clone(newData);
        });
    }
}
