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
import { ScriptException } from '../exception';
import { params } from '../model';
import { Pipeline } from '../pipeline';
import * as util from '../util';

export class ExpectAction extends Action {
    static $type = 'Flow.expect';
    static $icon = 'fas fa-check';
    static $help = `
Fails with specified error code if condition holds \`false\` over specified time.

The pipeline should produce a single element with boolean value.
If the value is \`false\`, the pipeline is run again until either the condition becomes \`true\` or timeout occurs.

Expect actions are used to catch expected anomalies in script execution (e.g. validation errors)
so that a  specific error code is thrown instead of a generic one
(e.g. \`FlightNotFoundError\` vs \`ElementNotFoundError\`).

By default action will retry the pipeline multiple times on \`false\` outcomes,
until it either becomes \`true\` or the timeout occurs.
This behaviour, along with custom timeouts, can be useful for waiting arbitrarily long processes
(e.g. loading screens, progress bars, interstitials, etc.)

Note: context matchers are special kinds of expects, which do not accept error codes and custom timeouts.
The treatment of pipeline results are otherwise identical to Expect actions.

### Parameters

- error code: a custom error code to throw if expectation fails
- custom timeout: a timeout in milliseconds

### Use For

- asserting on-page conditions
- increasing error specificity on expected failures
- waiting for arbitrarily long processes to finish
`;

    @params.Pipeline()
    pipeline!: Pipeline;
    @params.String({ source: 'errorCodes' })
    errorCode: string = 'ExpectationFailed';
    @params.Boolean()
    useCustomTimeout: boolean = false;
    @params.Number({
        min: 0,
        max: 900000,
    })
    customTimeout: number = 60000;

    async exec() {
        const { customTimeout, useCustomTimeout } = this;
        const options = useCustomTimeout ? {
            retryTimeoutMin: customTimeout,
            retryTimeoutMax: customTimeout,
        } : {};
        await this.retry(() => this.performCheck(), options);
    }

    async performCheck() {
        const el = await this.selectSingle(this.pipeline, false);
        util.checkType(el!.value, 'boolean');
        if (!el!.value) {
            throw new ScriptException({
                name: this.errorCode,
                message: `Expectation failed (code=${this.errorCode})`,
                retry: true,
                scriptError: this.errorCode !== 'ExpectationFailed',
            });
        }
    }
}
