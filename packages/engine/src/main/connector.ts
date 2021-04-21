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

import Ajv from 'ajv';

import { util } from '.';
import { ConnectorAction } from './connector-action';
import * as params from './model/params';
import { JsonSchema } from './schema';
import { CredentialsConfig } from './services/credentials';

const ajv = new Ajv({
    messages: true,
});

export interface ConnectorSpec {
    icon: string; // Action.$icon
    auth: CredentialsConfig[];
    baseUrl: string;
    endpoints: ConnectorEndpoint[];
}

export interface ConnectorEndpoint {
    name: string;
    description: string;
    path: string;
    method: string;
    parameters: ConnectorParameter[]
}

export interface ConnectorParameter {
    key: string;
    location: ConnectorParameterLocation;
    description?: string;
    required?: boolean; // default to false
    default?: any;
}

export type ConnectorParameterLocation = 'path' | 'query' | 'body' | 'formData' | 'header';

export function buildConnectors(namespace: string, spec: ConnectorSpec) {
    const actions = {} as any;
    // validate meta only. which we throws when invalid
    validate(connectorSpecSchema, {
        icon: spec.icon,
        baseUrl: spec.baseUrl,
        auth: spec.auth,
        endpoints: []
    }, true);
    for (const endpoint of spec.endpoints) {
        const { valid } = validate(endpointSchema, endpoint);
        if (!valid) {
            continue;
        }
        const name = `${namespace}.${endpoint.name}.${endpoint.method.toLocaleLowerCase()}`;
        class ChildConnectorAction extends ConnectorAction {
            static $type = name;
            static $help = endpoint.description;
            static $icon = `${!spec.icon.match(/http/) ? 'fab ' : 'fas '}${spec.icon}`;
            $baseUrl = spec.baseUrl;
            $endpoint = endpoint;

            @params.Credentials({
                providerName: namespace,
                configs: spec.auth
            })
            auth!: CredentialsConfig;
        }

        actions[name] = ChildConnectorAction;
    }
    return actions;
}

const endpointSchema: JsonSchema = {
    type: 'object',
    required: [
        'name', 'description', 'path',
        'method', 'parameters'
    ],
    properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        path: { type: 'string' },
        method: { type: 'string' },
        parameters: {
            type: 'array',
            items: {
                type: 'object',
                required: ['key', 'location'],
                properties: {
                    key: { type: 'string' },
                    location: { type: 'string', enum: ['path', 'query', 'body', 'formData', 'header'] },
                    description: { type: 'string' },
                    required: { type: 'boolean', default: false },
                    default: { } // any
                },
            }
        },
    },
};

const connectorSpecSchema: JsonSchema = {
    type: 'object',
    required: ['auth', 'baseUrl', 'icon', 'endpoints'],
    properties: {
        icon: { type: 'string' },
        baseUrl: { type: 'string' },
        auth: {
            type: 'array',
            items: {
                type: 'object',
                required: ['type'],
                properties: {
                    type: { type: 'string', enum: ['basic', 'bearer', 'oauth1', 'oauth2'] },
                    // auth agent specific properties...
                }
            }
        },
        endpoints: {
            type: 'array',
            items: endpointSchema
        }
    }
};

function validate(schema: JsonSchema, value: any, throwInvalid: boolean = false) {
    const validator = ajv.compile(schema);
    const valid = validator(value);
    if (!valid && throwInvalid) {
        throw util.createError({
            code: 'ValidationError',
            message: 'Spec does not conform to schema',
            details: {
                messages: validator.errors?.map(_ => _.schemaPath + ': ' + _.message),
            },
            retry: false,
        });
    }
    return {
        valid,
        details: validator.errors,
    };
}

export function validateConnectorSpec(value: any) {
    return validate(connectorSpecSchema, value);
}
