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

/**
 * @internal
 */
export interface ObjectWithId {
    id: string;
}

/**
 * @internal
 */
export interface IdDatabase {
    registerId(id: string, object: any): void;
    unregisterId(id: string): void;
}

/**
 * @public
 */
export interface Category<T> {
    name: string;
    items: T[];
}

// TODO oauth1
export type CredentialsType = 'basic' | 'bearer' | 'oauth2';

export type CredentialsConfig =
    CredentialsBasicConfig |
    CredentialsBearerConfig |
    CredentialsOAuth2Config;

export interface CredentialsBasicConfig {
    type: 'basic';
}

export interface CredentialsBearerConfig {
    type: 'bearer';
    prefix?: string;
}

export interface CredentialsOAuth2Config {
    type: 'oauth2';
    authorizationUrl: string;
    tokenUrl: string;
    scopes: string;
}

export type CredentialsData =
    CredentialsBasicData |
    CredentialsBearerData |
    CredentialsOAuth2Data;

export interface CredentialsBasicData {
    username: string;
    password: string;
}

export interface CredentialsBearerData {
    token: string;
    prefix: string;
}

export interface CredentialsOAuth2Data {
    clientId: string;
    clientSecret: string;
    refreshToken?: string;
}
