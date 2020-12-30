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

import { App } from './app';
import { controllers } from './controller';

/**
 * Creates Vue provider which allows injecting controllers in Vue components.
 *
 * See https://vuejs.org/v2/api/#provide-inject
 */
export function createControllerProvider(app: App) {
    const result: any = {};
    for (const descriptor of controllers) {
        if (!descriptor.alias) {
            continue;
        }
        result[descriptor.alias] = app.get(descriptor.class);
    }
    return result;
}
