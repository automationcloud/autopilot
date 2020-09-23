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

import { Action } from '../action';
import { Pipeline } from '../pipeline';
import * as util from '../util';
import { params } from '../model';

export class SetGlobalAction extends Action {
    static $type = 'Global.setGlobal';
    static $icon = 'fas fa-globe';
    static $help = `
Sets a global variable, which can be subsequently obtained using Get Global pipe.

The pipeline should return a single element. Its value will be associated with specified key.

### Parameters

- key: a symbolic variable name for holding the stage value

### Use For

- storing the results of other actions so that they could be accessed later in scripts
`;

    @params.String({ source: 'globals' })
    key: string = '';

    @params.Pipeline()
    pipeline!: Pipeline;

    @params.Boolean()
    optional: boolean = false;

    getLabel() {
        return this.key;
    }

    async exec() {
        util.assertScript(this.key, 'key is required');
        await this.retry(async () => {
            const el = await this.selectSingle(this.pipeline, this.optional);
            if (el) {
                this.$script.setGlobal(this.key, el.value);
            }
        });
    }
}
