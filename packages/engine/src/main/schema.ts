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
