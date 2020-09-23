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

export interface ErrorSpec {
    message: string;
    code: string;
    retry: boolean;
    details?: any;
    scriptError?: boolean;
}

export class GenericError extends Error {
    code: string;
    retry: boolean;
    details: any;
    scriptError: boolean;

    constructor(spec: ErrorSpec) {
        super(spec.message);
        this.name = spec.code;
        this.code = spec.code;
        this.retry = spec.retry;
        this.details = spec.details || {};
        this.scriptError = spec.scriptError || false;
    }
}

export function createError(spec: ErrorSpec) {
    return new GenericError(spec);
}
