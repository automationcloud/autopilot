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

import { StandardLogger } from '@ubio/framework';
import { injectable, inject } from 'inversify';
import { WorkerState } from '../services/state';

@injectable()
export class WorkerLogger extends StandardLogger {
    _contextData: object = {};

    constructor(
        @inject(WorkerState)
        protected state: WorkerState,
    ) {
        super();

        Object.defineProperties(this, {
            contextData: {
                get() {
                    return {
                        ...this.state.getInfo(),
                        ...this._contextData,
                    };
                },
                set(data: object) {
                    this._contextData = data;
                }
            }
        });
    }

}
