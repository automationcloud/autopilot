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

import { Exception } from '@automationcloud/cdp';
import { inject } from 'inversify';

import { ScriptInput, ScriptPlaybackStatus } from '..';
import { FlowService } from '../services';
import { LocalRobot } from './local-robot';

/**
 * An adapter to Egnine `FlowService` which manages inputs and outputs
 * in the scope of `LocalRobot` instance.
 *
 * @internal
 */
export class LocalFlowService extends FlowService {

    awaitingInputKeys: string[] = [];

    constructor(
        @inject('Robot')
        protected robot: LocalRobot,
    ) {
        super();
    }

    get script() {
        return this.robot.script;
    }

    async requestInputData(key: string) {
        const existingInput = this.script.$inputs.find(_ => _.key === key);
        if (existingInput) {
            return existingInput.data;
        }
        return new Promise((resolve, reject) => {
            const { inputTimeout } = this.robot.config;
            const timer = setTimeout(() => {
                cleanup();
                reject(new Exception({
                    name: 'InputTimeout',
                    message: `Input timeout (key=${key})`,
                    details: { key },
                }));
            }, inputTimeout);
            const onInputSubmitted = (input: ScriptInput) => {
                if (input.key === key) {
                    this.awaitingInputKeys = this.awaitingInputKeys.filter(k => k !== key);
                    cleanup();
                    resolve(input.data);
                }
            };
            const onStatusUpdated = (status: ScriptPlaybackStatus) => {
                cleanup();
                reject(new Exception({
                    name: 'AwaitingInputInterrupted',
                    message: `Awaiting input was interrupted because job script switched to "${status}"`,
                }));
            };
            const cleanup = () => {
                clearTimeout(timer);
                this.script.$events.removeListener('inputSubmitted', onInputSubmitted);
                this.script.$events.removeListener('statusUpdated', onStatusUpdated);
            };
            this.script.$events.addListener('inputSubmitted', onInputSubmitted);
            this.script.$events.addListener('statusUpdated', onStatusUpdated);
            this.awaitingInputKeys.push(key);
            this.script.$events.emit('awaitingInput', key);
        });
    }

    async peekInputData(key: string) {
        const input = this.script.$inputs.find(_ => _.key === key);
        return input ? input.data : undefined;
    }

    async resetInputData(_key: string): Promise<void> {
        // Nothing is required
    }

    async sendOutputData(_key: string, _data: any) {
        // Nothing is required: outputs are managed by script.
    }

}
