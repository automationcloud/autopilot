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

import { injectable } from 'inversify';
import assert from 'assert';
import { FlowService } from '../services';
import { ScriptInput, ScriptOutput } from '../script';

@injectable()
export class FlowServiceMock extends FlowService {
    inputs: ScriptInput[] = [];
    outputs: ScriptOutput[] = [];

    async requestInputData(key: string) {
        const input = this.inputs.find(_ => _.key === key);
        assert(input, `Input ${key} not found`);
        return input!.data;
    }

    async peekInputData(key: string) {
        const input = this.inputs.find(_ => _.key === key);
        return input?.data || null;
    }

    async sendOutputData(key: string, data: any) {
        this.outputs.push({ key, data });
    }

    async sendScreenshot() { }
    async sendHtmlSnapshot() { }
    async sendEvent() { }
}
