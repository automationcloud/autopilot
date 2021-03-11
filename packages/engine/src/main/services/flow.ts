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
import { injectable } from 'inversify';

import { Script } from '../script';

@injectable()
export abstract class FlowService {
    isInputsCached(): boolean {
        return true;
    }

    abstract requestInputData(key: string): Promise<any>;
    abstract peekInputData(key: string): Promise<any>;
    abstract sendOutputData(key: string, data: any): Promise<void>;

    /**
     * Invoked during script playback (before action, before context match attempt,
     * before action retry, etc).
     * Executor can implement custom logic here to synchronize script playback
     * with external events or to interrupt it.
     */
    async tick(script: Script) {
        if (script.isPaused()) {
            throw new Exception({
                name: 'ScriptExecutionInterrupted',
                message: 'Script execution interrupted',
                retry: false,
            });
        }
    }

    /**
     * Returns information available in a specific runtime (e.g. worker id, job id, etc)
     *
     * @experimental
     */
    getMetadata(): any {
        return {};
    }

}
