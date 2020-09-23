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

import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { ScriptException } from '../exception';
import { params } from '../model';

export class FailAction extends Action {
    static $type = 'Flow.fail';
    static $icon = 'fas fa-minus-circle';
    static $help = `
Finishes script execution with \`fail\` status, and specified error code.

Additionally, allows extracting and sending message alongside the failure event.
This message can be obtained by constructing a pipeline which returns a string value.

### Parameters

- error code: specifies execution error to throw

### Use For

- failing a script with specified error code
`;

    @params.Pipeline()
    pipeline!: Pipeline;

    @params.String({ source: 'errorCodes' })
    errorCode: string = 'Failure';

    getLabel() {
        return this.errorCode;
    }

    async exec() {
        const result = await this.retry(async () => {
            const el = await this.selectSingle(this.pipeline, true);
            if (el) {
                const type = util.getType(el.value);
                switch (type) {
                    case 'string':
                        return { message: el.value };
                    case 'object':
                        return el.value;
                    default:
                        util.assertScript(false, 'Value should be either String or Object');
                        return;
                }
            }
            return {};
        });
        const { code = this.errorCode, message: websiteMessage = '', details = {} } = result;
        util.checkType(code, 'string', 'code');
        util.checkType(websiteMessage, 'string', 'message');
        util.checkType(details, 'object', 'details');
        const err: any = new ScriptException({
            name: code,
            message: `Expected error (code=${code})`,
            retry: false,
            scriptError: true,
            details,
        });
        err.websiteMessage = websiteMessage;
        throw err;
    }
}
