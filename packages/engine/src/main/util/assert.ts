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

import { createError } from './error';

/**
 * Asserts `condition` and throws a non-retriable error with code `InvalidScript`.
 * Useful for asserting script configuration issues (e.g. empty mandatory parameter).
 *
 * @param condition If falsy, assertion error is thrown.
 * @param message User-friendly message stating the problem.
 * @param details Optional JSON details.
 * @public
 */
export function assertScript(condition: any, message: string, details?: any): void {
    if (!condition) {
        throw scriptError(message, details);
    }
}

/**
 * Creates a non-retriable error with code `InvalidScript`.
 * Useful for asserting script configuration issues (e.g. empty mandatory parameter).
 *
 * @param message User-friendly message stating the problem.
 * @param details Optional JSON details.
 * @public
 */
export function scriptError(message: string, details?: any): Error {
    return createError({
        code: 'InvalidScript',
        message,
        details,
        retry: false,
    });
}

/**
 * Asserts `condition` and throws a retriable error with code `PlaybackError`.
 * Useful for asserting generic runtime issues.
 *
 * @param condition If falsy, assertion error is thrown.
 * @param message User-friendly message stating the problem.
 * @param details Optional JSON details.
 * @public
 */
export function assertPlayback(condition: any, message: string, details?: any): void {
    if (!condition) {
        throw playbackError(message, details);
    }
}

/**
 * Creates a retriable error with code `PlaybackError`.
 * Useful for asserting generic runtime issues.
 *
 * @param condition If falsy, assertion error is thrown.
 * @param message User-friendly message stating the problem.
 * @param details Optional JSON details.
 * @public
 */
export function playbackError(message: string, details?: any): Error {
    return createError({
        code: 'PlaybackError',
        message,
        details,
        retry: true,
    });
}
