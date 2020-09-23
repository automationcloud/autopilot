// Copyright 2020 Ubio Limited
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

export interface ExceptionSpec {
    name: string;
    code?: string;
    message?: string;
    retry?: boolean;
    details?: object;
}

/**
 * Represents an error thrown with a specific error code.
 *
 * Additionally, `retry` can be specified to indicate that the error occurs in
 * intermediate application state (e.g. when page unloads/loads) and can be retried.
 *
 * @public
 */
export class Exception extends Error {
    code: string;
    retry?: boolean;
    details?: any;

    constructor(spec: ExceptionSpec) {
        super(spec.message);
        this.name = spec.name;
        this.code = spec.code || spec.name;
        this.message = spec.message || spec.name;
        if (spec.retry != null) {
            this.retry = spec.retry;
        }
        this.details = spec.details;
    }

}
