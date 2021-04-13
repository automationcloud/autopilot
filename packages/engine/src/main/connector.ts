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
import { CredentialsData, CredentialsType } from './services/credentials';

export interface ConnectorSpec {
    // metadata for ConnectorAction
    name: string; // Action.$type
    icon: string; // Action.$icon
    description: string; // Action.$help

    // requests
    authScheme: CredentialsType;
    auth: CredentialsData;
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
}

export type ConnectorParameterLocation = 'path' | 'query' | 'body' | 'formData' | 'header';
