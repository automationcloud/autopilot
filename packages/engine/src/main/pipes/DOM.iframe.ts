// Copyright 2020 Ubio Limited
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

import * as util from '../util';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomIframe extends Pipe {
    static $type = 'DOM.iframe';
    static $help = `
Returns DOM contentDocument node of the IFRAME element.
An error is thrown if applied to non-frame elements.

### Use For

- accessing the contents of iframes
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        return await this.map(inputSet, async el => {
            util.assertPlayback(el.remote.isFrame(), `Cannot get content document on ${el.description}`);
            return await el.contentDocument();
        });
    }
}
