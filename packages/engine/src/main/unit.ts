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

import * as model from './model';
import { Pipeline } from './pipeline';
import { Action } from './action';
import { Context } from './context';
import { Script } from './script';
import { Element } from './element';
import { parseModuleMetadata, ModuleMetadata, Module } from './module';
import { Container } from 'inversify';

/**
 * Base class of Action and Pipe, manages parameter (de)serialization and
 * provides common functionality.
 *
 * @internal
 */
export abstract class Unit<P> extends model.Entity<P> {
    static $help = '';

    static get $metadata(): ModuleMetadata {
        const module = this as any;
        if (!module.hasOwnProperty('_meta')) {
            module._meta = parseModuleMetadata(module);
        }
        return module._meta;
    }

    abstract get type(): string;
    abstract get $action(): Action;

    /**
     * A typed reference to pipe constructor.
     * @internal
     */
    get $class() { return (this.constructor as unknown) as Module; }

    /**
     * Context enclosing this instance.
     * @public
     */
    get $context(): Context { return this.$action.$context; }

    /**
     * Script this instance belongs to.
     * @public
     */
    get $script(): Script { return this.$context.$script; }

    /**
     * Engine this instance is connected to.
     * @public
     */
    get $engine() { return this.$script.$engine; }

    /**
     * {@link BrowserService} the script is connected to.
     * @public
     */
    get $browser() { return this.$script.$browser; }

    /**
     * The {@link Page} the script is currently attached to.
     * @public
     */
    get $page() { return this.$script.$page; }

    /**
     * @beta
     */
    get $container(): Container {
        const ext = this.$class.$extension!;
        return ext.container;
    }

    /**
     * Serializes this instance to JSON.
     *
     * @public
     */
    toJSON() {
        return {
            ...super.toJSON(),
            type: this.type,
        };
    }

    /**
     * @returns All parameter metadata for this instance, based on `@params` decorators.
     *
     * @public
     */
    getParams(): model.ParamSpec[] {
        // TODO cache those (params should remain static after first invocation)
        return model.getAllParams(this.constructor.prototype);
    }

    /**
     * Coerces the type of parameter `value` based on its metadata.
     * @param param
     * @param value
     * @internal
     */
    deserializeParam(param: model.ParamSpec, value: any): any {
        switch (param.type) {
            case 'string':
            case 'enum':
            case 'selector':
            case 'template':
            case 'json':
            case 'javascript':
            case 'definition':
                return String(value || '');
            case 'keys':
                return Array.isArray(value) ? value.map(String) : [];
            case 'recordset': {
                const records: any[] = [];
                const array: any[] = Array.isArray(value) ? value : [];
                for (const row of array) {
                    const record: any = {};
                    for (const field of param.fields) {
                        const val = this.deserializeParam(field, row[field.name]);
                        record[field.name] = val;
                    }
                    records.push(record);
                }
                return records;
            }
            case 'boolean':
                return Boolean(value || false);
            case 'number': {
                if (value == null) {
                    return null;
                }
                const num = parseFloat(value);
                return isNaN(num) ? null : num;
            }
            case 'pipeline':
                return new Pipeline(this, param.name, value || {});
            default:
                return value;
        }
    }

    /**
     * Deserializes parameters from `spec` based on parameter metadata.
     * @param spec
     * @internal
     */
    readParams(spec: any) {
        for (const param of this.getParams()) {
            if (!param.serialized) {
                continue;
            }
            // Value is read from either spec, or param defaults, or class-level defaults
            // (whichever one is non-null first)
            const val = [spec[param.name], param.value, (this as any)[param.name]].find(_ => _ != null);
            (this as any)[param.name] = this.deserializeParam(param, val);
        }
    }

    /**
     * @returns The parameter value of specified `name`.
     * @param name
     * @internal
     */
    getParamValue(name: string) {
        return (this as any)[name];
    }

    /**
     * Creates a `#document` element with specified `value`.
     *
     * @param value
     * @public
     */
    async createDocument(value: any = {}): Promise<Element> {
        const document = await this.$page.document();
        return new Element(document, value);
    }

}
