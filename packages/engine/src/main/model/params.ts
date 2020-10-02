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

import * as util from '../util';

/**
 * @internal
 */
export const PARAMS_SYMBOL = Symbol('Params');

/**
 * Basic parameter types.
 *
 * @internal
 */
export type BasicParamType = 'string' | 'enum' | 'number' | 'boolean' | 'selector';

/**
 * Advanced parameter types.
 *
 * @internal
 */
export type AdvancedParamType =
    'json' |
    'javascript' |
    'definition' |
    'template' |
    'keys' |
    'recordset' |
    'pipeline' |
    'button' |
    'preview' |
    'outcome' |
    'ref';

/**
 * All possible parameter types.
 *
 * @internal
 */
export type ParamType = BasicParamType | AdvancedParamType;

/**
 * Supported data sources for autocompletion.
 *
 * @internal
 */
export type StringSource =
    'attributes' |
    'classList' |
    'inputs' |
    'outputs' |
    'globals' |
    'locals' |
    'dataPaths' |
    'errorCodes';

/**
 * Represents parameter metadata for actions and pipes.
 *
 * Both actions and pipes render their UIs based on class properties with decorator-based metadata.
 * Parameters can optionally provide custom `label`, `help` text, `placeholder` (where applicable)
 * and other type-dependent fields.
 *
 * @internal
 */
export interface ParamSpec {
    type: BasicParamType | AdvancedParamType;
    name: string;
    serialized: boolean;
    label?: string;
    help?: string;
    placeholder?: string;
    [key: string]: any;
}

/**
 * Declares String parameter rendered as text box.
 * If `source` is specified, a context-specific autocompletion is added.
 *
 * @param spec
 * @public
 */
export function String(
    spec: {
        source?: StringSource;
        label?: string;
        help?: string;
        placeholder?: string;
    } = {},
) {
    return paramDecorator('string', spec);
}

/**
 * Declares Enum parameter rendered as select box.
 * The value is constrained to the values specified in `spec.enum`.
 *
 * @param spec
 * @public
 */
export function Enum(spec: {
    enum: string[] | Array<{ label: string; value: string }>;
    label?: string;
    help?: string;
    placeholder?: string;
}) {
    return paramDecorator('enum', { ...spec });
}

/**
 * Declares Number parameter rendered as number box.
 * The value is optionally constrained between `spec.min` and `spec.max` values.
 *
 * @param spec
 * @public
 */
export function Number(
    spec: {
        label?: string;
        help?: string;
        placeholder?: string;
        min?: number;
        max?: number;
    } = {},
) {
    return paramDecorator('number', spec);
}

/**
 * Declares Boolean parameter rendered as a checkbox.
 * @param spec
 * @public
 */
export function Boolean(spec: { label?: string; help?: string } = {}) {
    return paramDecorator('boolean', spec);
}

/**
 * Declares Selector parameter rendered as selector picker.
 * @param spec
 * @public
 */
export function Selector(spec: { label?: string; help?: string } = {}) {
    return paramDecorator('selector', { ...spec });
}

/**
 * Declares JSON parameter rendered as JSON code editor.
 * @param spec
 * @public
 */
export function Json(spec: { label?: string; help?: string } = {}) {
    return paramDecorator('json', spec);
}

/**
 * Declares JavaScript parameter rendered as JavaScript code editor.
 * @param spec
 * @public
 */
export function JavaScript(spec: { label?: string; help?: string } = {}) {
    return paramDecorator('javascript', spec);
}

/**
 * Declares Definition parameter rendered with select box listing available definitions.
 * The parameter value will be the `id` of definition.
 * @param spec
 * @public
 */
export function Definition(spec: { label?: string; help?: string } = {}) {
    return paramDecorator('definition', spec);
}

/**
 * Declares a param reference parameter. Designed to be used by Get Outcome pipe.
 * @param spec
 * @beta
 */
export function ParamRef(spec: { label?: string; help?: string } = {}) {
    return paramDecorator('ref', spec);
}

/**
 * Declares Template parameter.
 *
 * @param spec
 * @deprecated This component is too ad-hoc (bound to a single implementation using it), so
 *   please avoid depending on it.
 * @internal
 */
export function Template(spec: { label?: string; help?: string } = {}) {
    return paramDecorator('template', spec);
}

/**
 * Declares Keys parameter, rendered as a custom component for picking object keys.
 * @param spec
 * @internal
 * @deprecated This component is too ad-hoc (bound to a single implementation using it), so
 *   please avoid depending on it.
 */
export function Keys(spec: { label?: string; help?: string } = {}) {
    return paramDecorator('keys', spec);
}

/**
 * Declares Pipeline parameter.
 * @param spec
 * @public
 */
export function Pipeline(spec: { label?: string; help?: string } = {}) {
    return paramDecorator('pipeline', { ...spec });
}

/**
 * Declares Recordset parameter, rendered as a table with dynamic rows and static columns.
 * `spec.fields` is used to specify the schema of columns.
 *
 * @param spec
 * @public
 */
export function Recordset(spec: { label?: string; help?: string; singular: string; fields: RecordsetField[] }) {
    return paramDecorator('recordset', spec);
}

/**
 * Declares Button parameter.
 * @param spec
 * @public
 */
export function Button(spec: { label?: string; help?: string } = {}) {
    return paramDecorator('button', {
        ...spec,
        serialized: false,
    });
}

/**
 * Declares Preview parameter, used to display the intermediary of an action or pipe.
 * The parameter is rendered as JSON explorer component.
 *
 * @param spec
 * @public
 */
export function Preview(spec: {
    label?: string;
    placeholder?: string;
    outputKeyProp?: string;
} = {}) {
    return paramDecorator('preview', spec);
}

/**
 * Declares Outcome parameter, used to display the intermediary of an action or pipe.
 * Action outcomes can be consumed by Get Outcome pipe.
 *
 * The parameter is rendered as JSON explorer component.
 *
 * @param spec
 * @beta
 */
export function Outcome(spec: {
    label?: string;
    placeholder?: string;
    outputKeyProp?: string;
} = {}) {
    return paramDecorator('outcome', spec);
}

/**
 * @public
 */
export interface RecordsetField {
    type: BasicParamType;
    name: string;
    source?: StringSource;
    value?: any;
    label?: string;
    enum?: string[];
    min?: number;
    max?: number;
    placeholder?: string;
}

function paramDecorator(type: ParamType, spec: any) {
    return (target: any, propertyKey: string) => {
        const params: ParamSpec[] = Reflect.getOwnMetadata(PARAMS_SYMBOL, target) || [];
        params.push({
            value: null,
            serialized: true,
            label: util.humanize(propertyKey),
            ...spec,
            name: propertyKey,
            type,
        });
        Reflect.defineMetadata(PARAMS_SYMBOL, params, target);
    };
}

/**
 * Obtains all parameter metadata declared on specified `target` prototype.
 *
 * @param target Action/Pipe prototype
 * @internal
 */
export function getAllParams(target: any): ParamSpec[] {
    let params: ParamSpec[] = [];
    let proto = target;
    while (proto !== Object.prototype) {
        const ownParams: ParamSpec[] = Reflect.getOwnMetadata(PARAMS_SYMBOL, proto) || [];
        const filteredParams = ownParams.filter(param =>
            !params.some(p => p.name === param.name));
        params = filteredParams.concat(params);
        proto = Object.getPrototypeOf(proto);
    }
    return params;
}
