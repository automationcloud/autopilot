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

import { params } from '../model';
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../runtime';
import { Element } from '../element';

export class DomDocumentProperty extends Pipe {
    static $type = 'DOM.getDocumentProperty';
    static $help = `
Retrieves specified property from the element's owner document.

### Use For

- accessing current url
- accessing referrer to compose network requests
- accessing current page title
- accessing other document properties for advanced scripting
`;

    @params.Enum({
        enum: [
            'URL',
            'domain',
            'referrer',
            'cookie',
            'title',
            'dir',
            'lastModified',
            'characterSet',
            'contentType',
            'readyState',
        ],
    })
    property: string = 'URL';

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const property = this.property;

        return this.map(inputSet, async el => {
            const data = await el.evaluateJson((el, property) => {
                const ownerDocument = el.nodeType === 9 ? el : el.ownerDocument;
                return ownerDocument[property];
            }, property);
            return el.clone(data == null ? null : data);
        });
    }
}
