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

// import assert from 'assert';
import dotenv from 'dotenv';

import { Exception } from './exception';

dotenv.config();

// Declarations are stored globally, to avoid module-local storage
const CONFIG_GLOBAL_KEY = Symbol.for('@automationcloud/autopilot:configDeclarations');

export type ConfigValue = number | string | boolean;

export interface PropertyDecl<T extends ConfigValue> {
    type: 'string' | 'boolean' | 'number';
    key: string;
    defaultValue?: T;
    parse(str: string): T;
}

export function getConfigDeclarations(): Map<string, PropertyDecl<any>> {
    let map = (global as any)[CONFIG_GLOBAL_KEY];
    if (!(map instanceof Map)) {
        map = new Map();
        (global as any)[CONFIG_GLOBAL_KEY] = map;
    }
    return map;
}

export function stringConfig(key: string, defaultValue?: string): PropertyDecl<string> {
    return declare<string>({
        type: 'string',
        key,
        defaultValue,
        parse(str: string) {
            return str;
        }
    });
}

export function booleanConfig(key: string, defaultValue?: boolean): PropertyDecl<boolean> {
    return declare<boolean>({
        type: 'boolean',
        key,
        defaultValue,
        parse(str: string) {
            return str === 'true';
        }
    });
}

export function numberConfig(key: string, defaultValue?: number): PropertyDecl<number> {
    return declare<number>({
        type: 'number',
        key,
        defaultValue,
        parse(str: string) {
            // TODO throw if NaN?
            return Number(str);
        }
    });
}

function declare<T extends ConfigValue>(decl: PropertyDecl<T>): PropertyDecl<T> {
    // const existing = getConfigDeclarations().get(decl.key);
    // if (existing) {
    //     assert.equal(decl.type, existing.type,
    //         `Config ${decl.key} is declared more than once with different types`);
    //     assert.equal(decl.defaultValue, existing.defaultValue,
    //         `Config ${decl.key} is declared more than once with different default values`);
    // }
    getConfigDeclarations().set(decl.key, decl);
    return decl;
}

/**
 * Provides common configuration framework to Engine and its components.
 * This allows reading configuration properties from `process.env` or similar key/value
 * source, without necessity of managing all configuration settings centrally.
 *
 * @internal
 */
export class Configuration {
    values: Map<string, string> = new Map();

    resolve<T extends ConfigValue>(decl: PropertyDecl<T>): T | null {
        const str = this.values.get(decl.key);
        if (str != null) {
            return decl.parse(str);
        }
        if (decl.defaultValue != null) {
            return decl.defaultValue;
        }
        return null;
    }

    get<T extends ConfigValue>(decl: PropertyDecl<T>): T {
        const val = this.resolve(decl);
        if (val != null) {
            return val;
        }
        throw new Exception({
            name: 'ConfigurationError',
            message: `Configuration ${decl.key} not provided`,
        });
    }

    setAll(object: { [key: string]: string | null | undefined }) {
        for (const [key, value] of Object.entries(object)) {
            // Note: empty strings should still be set
            if (value != null) {
                this.values.set(key, value?.trim());
            }
        }
    }

    getMissingConfigs(): Array<PropertyDecl<any>> {
        const missing = [];
        for (const decl of getConfigDeclarations().values()) {
            if (this.resolve(decl) == null) {
                missing.push(decl);
            }
        }
        return missing;
    }

}

export class EnvConfiguration extends Configuration {

    constructor() {
        super();
        this.setAll(process.env);
    }

}
