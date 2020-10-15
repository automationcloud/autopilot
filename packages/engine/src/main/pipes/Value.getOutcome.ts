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
import { Pipe } from '../pipe';
import { RuntimeCtx } from '../ctx';
import { Element } from '../element';
import { ActionParamReference } from '../action';
import * as util from '../util';

export class ValueGetOutcome extends Pipe {
    static $type = 'Value.getOutcome';
    static $help = `
Returns an outcome of another action.
`;

    @params.ParamRef({
        label: 'Reference'
    })
    ref: ActionParamReference = { actionId: '', paramName: '' };

    @params.Boolean()
    optional: boolean = false;

    async apply(inputSet: Element[], _ctx: RuntimeCtx): Promise<Element[]> {
        const value = this.getValue();
        return this.map(inputSet, el => {
            return el.clone(value);
        });
    }

    getValue() {
        const ref = this.ref;
        const action = this.$script.getActionById(ref.actionId);
        if (!action) {
            throw util.scriptError('Referenced action not found', { ref });
        }
        const param = action.getParams().filter(_ => _.type === 'outcome').find(_ => _.name === ref.paramName);
        if (!param) {
            throw util.scriptError('Action parameter not found', { ref });
        }
        const value = action.getParamValue(param.name);
        if (value === undefined && !this.optional) {
            throw util.createError({
                code: 'OutcomeNotAvailable',
                message: 'Outcome not available (make sure referenced action ran successfully)',
                retry: false,
                details: { ref, value }
            });
        }
        return value ?? null;
    }
}
