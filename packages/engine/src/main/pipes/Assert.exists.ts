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
