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

import { Context } from './context';
import { Script } from './script';

export const sessionHandlers: Set<SessionConstructor> = new Set();

export interface SessionLifecycleHandler {
    onSessionStart?(): Promise<void>;
    onSessionFinish?(): Promise<void>;
    onScriptRun?(script: Script): Promise<void>;
    onContextEnter?(context: Context): Promise<void>;
}

export interface SessionConstructor {
    prototype: SessionLifecycleHandler;
}

export function SessionHandler() {
    return (target: SessionConstructor) => {
        sessionHandlers.add(target);
    };
}
