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

export type JsonSchemaTypePrimitive = 'null' | 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
export type JsonSchemaType = JsonSchemaTypePrimitive | JsonSchemaTypePrimitive[];

export interface JsonSchema {
    type?: JsonSchemaType;
    // number
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    multipleOf?: number;
    // string
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string;
    // array
    minItems?: number;
    maxItems?: number;
    uniqueItems?: number;
    items?: JsonSchema | JsonSchema[];
    additionalItems?: boolean | JsonSchema;
    contains?: JsonSchema;
    // object
    minProperties?: number;
    maxProperties?: number;
    required?: string[];
    properties?: { [key: string]: JsonSchema };
    patternProperties?: { [key: string]: JsonSchema };
    additionalProperties?: boolean | JsonSchema;
    propertyNames?: JsonSchema;
    // any
    enum?: any[];
    const?: any;
    // compound
    not?: JsonSchema;
    oneOf?: JsonSchema[];
    anyOf?: JsonSchema[];
    allOf?: JsonSchema[];
    if?: JsonSchema[];
    then?: JsonSchema[];
    else?: JsonSchema[];
    // misc
    [key: string]: any;
}
