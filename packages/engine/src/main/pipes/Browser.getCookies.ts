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

import { Pipe } from '../pipe';
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';

export class GetCookiesPipe extends Pipe {
    static $type = 'Browser.getCookies';
    static $help = `
Obtains browser cookies and returns them as element values.
`;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const cookies = await this.$page.getAllCookies();
        const results = [];
        for (const el of inputSet) {
            for (const cookie of cookies) {
                results.push(el.clone(cookie));
            }
        }
        return results;
    }
}
