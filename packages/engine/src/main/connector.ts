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

/*
Just interface, aligned with @params.Credentials and existing JSON specs
(clean up, use only what’s necessary to send the request).
*/

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
    // metadata for ConnectorAction
    name: string; // Action.$type
    icon: string; // Action.$icon
    description: string; // Action.$help

    // requests
    auth: CredentialsConfig[];
    baseUrl: string;
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

export function buildConnectors(namespace: string, specs: ConnectorSpec[]) {
    // is it called when extension.load is called?
    // when extension() is called, generate the modules
    // return specs.map(spec => {
    const actions = {} as any;
    for (const spec of specs) {
        const { valid, details } = validateConnectorSpec(spec);
        if (!valid) {
            console.debug('[connector] spec ' + spec.name + ' invalid: ', { details });
            console.info(`[connector] spec ${namespace}.${spec.name} is skipped`);
            continue;
        }
        const name = `${namespace}.${spec.name}.${spec.method}`;
        class ChildConnectorAction extends ConnectorAction {
            static $type = name;
            static $help = spec.description;
            static $icon = `${!spec.icon.match(/http/) ? 'fab ' : 'fas '}${spec.icon}`;
            $spec = spec;

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

const connectorSpecSchema: JsonSchema = {
    type: 'object',
    required: [
        'name', 'icon', 'description',
        'auth', 'baseUrl', 'path',
        'method', 'parameters'
    ],
    properties: {
        name: { type: 'string' },
        icon: { type: 'string' },
        description: { type: 'string' },
        auth: {
            type: 'array',
            items: {
                type: 'object',
                required: ['type'],
                properties: {
                    type: { type: 'string', enum: ['basic', 'bearer', 'oauth1', 'oauth2'] },
                    // type specific properties...
                }
            }
        },
        baseUrl: { type: 'string' },
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

export function validateConnectorSpec(value: any, throwInvalid?: boolean) {
    const validator = ajv.compile(connectorSpecSchema);
    const valid = validator(value);
    if (!valid && throwInvalid) {
        throw util.createError({
            code: 'ConnectorSpecValidationError',
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
