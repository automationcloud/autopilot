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

import { Extension } from './extension';

/**
 * Metaprogramming interface for exposing library-related info on Action and Pipe prototypes.
 * @internal
 */
export interface Module {
    $type: string;
    $help: string;
    $metadata: ModuleMetadata;
    $description?: string;
    $icon?: string;
    $deprecated?: string;
    $hidden?: boolean;
    $extension?: Extension;
}

/**
 * @param module
 * @internal
 */
export function parseModuleMetadata(module: Module): ModuleMetadata {
    const $type = module.$type || '';
    const i = module.$type.indexOf('.');
    const ns = i > -1 ? $type.substring(0, i) : 'Custom';
    const method = i > -1 ? $type.substring(i + 1) : $type;
    return { ns, method };
}

/**
 * @internal
 */
export interface ModuleMetadata {
    ns: string;
    method: string;
}
